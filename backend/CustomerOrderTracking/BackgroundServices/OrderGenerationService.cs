using CustomerOrderTracking.Hubs;
using CustomerOrderTracking.Services;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace CustomerOrderTracking.BackgroundServices
{
    public class OrderGenerationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<OrderHub> _hubContext;
        private readonly ILogger<OrderGenerationService> _logger;
        private readonly ConcurrentDictionary<Guid, Timer> _customerTimers = new();

        private static readonly string[] _products =
        {
            "Laptop", "Mouse", "Keyboard", "Monitor", "Headphones",
            "Webcam", "USB", "Watch", "Phone", "Handbag"
        };

        public OrderGenerationService(
            IServiceProvider serviceProvider,
            IHubContext<OrderHub> hubContext,
            ILogger<OrderGenerationService> logger)
        {
            _serviceProvider = serviceProvider;
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await LoadActiveCustomersAsync();
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in OrderGenerationService");
                }
            }
        }

        private async Task LoadActiveCustomersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var customerService = scope.ServiceProvider.GetRequiredService<ICustomerService>();

            var customers = await customerService.GetAllCustomers();
            var activeCustomerIds = customers.Where(c => c.IsActive).Select(c => c.Id).ToList();

            foreach (var customerId in activeCustomerIds)
            {
                if (!_customerTimers.ContainsKey(customerId))
                {
                    StartOrderGeneration(customerId);
                }
            }

      
            var inactiveCustomers = _customerTimers.Keys.Except(activeCustomerIds).ToList();
            foreach (var customerId in inactiveCustomers)
            {
                StopOrderGeneration(customerId);
            }
        }

        public void StartOrderGeneration(Guid customerId)
        {
            if (_customerTimers.ContainsKey(customerId)) return;

            var timer = new Timer(
                async _ => await GenerateOrderAsync(customerId),
                null,
                TimeSpan.FromSeconds(5),
                TimeSpan.FromMinutes(1)
            );

            _customerTimers.TryAdd(customerId, timer);
            _logger.LogInformation($"Started order generation for customer {customerId}");
        }

        public void StopOrderGeneration(Guid customerId)
        {
            if (_customerTimers.TryRemove(customerId, out var timer))
            {
                timer.Dispose();
                _logger.LogInformation($"Stopped order generation for customer {customerId}");
            }
        }

        private async Task GenerateOrderAsync(Guid customerId)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var customerService = scope.ServiceProvider.GetRequiredService<ICustomerService>();
                var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();

                var customer = await customerService.GetCustomerById(customerId);
                if (customer == null || !customer.IsActive)
                {
                    StopOrderGeneration(customerId);
                    return;
                }

                var random = new Random();
                var product = _products[random.Next(_products.Length)];
                var quantity = random.Next(1, 10);
                var unitPrice = random.Next(10, 1000);

                var orderDto = await orderService.CreateOrder(
                    customerId,
                    $"{quantity}x {product}",
                    quantity * unitPrice
                );

                _logger.LogInformation($"Generated order {orderDto.Id} for customer {customerId}");

                
                await _hubContext.Clients.Group($"customer_{customerId}")
                    .SendAsync("ReceiveOrder", orderDto);

                await _hubContext.Clients.All
                    .SendAsync("CustomerUpdated", customerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating order for customer {customerId}");
            }
        }

        public override void Dispose()
        {
            foreach (var timer in _customerTimers.Values)
            {
                timer.Dispose();
            }
            _customerTimers.Clear();
            base.Dispose();
        }
    }
}
