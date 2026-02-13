using CustomerOrderTracking.DTOs;
using CustomerOrderTracking.Models;
using CustomerOrderTracking.Repositories;

namespace CustomerOrderTracking.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICustomerRepository _customerRepository;

        public OrderService(IOrderRepository orderRepository, ICustomerRepository customerRepository)
        {
            _orderRepository = orderRepository;
            _customerRepository = customerRepository;
        }

        public async Task<PagedResult<OrderDto>> GetCustomerOrders(Guid customerId, OrderFilterDto filter)
        {
            var pagedOrders = await _orderRepository.GetCustomerOrders(customerId, filter);

            var orderDtos = pagedOrders.Items.Select(o => new OrderDto
            {
                Id = o.Id,
                Description = o.Description,
                Amount = o.Amount,
                CreatedAt = o.CreatedAt,
                CustomerId = o.CustomerId,
                CustomerName = o.Customer.Name
            }).ToList();

            return new PagedResult<OrderDto>
            {
                Items = orderDtos,
                TotalCount = pagedOrders.TotalCount,
                PageNumber = pagedOrders.PageNumber,
                PageSize = pagedOrders.PageSize
            };
        }

        public async Task<OrderDto?> GetOrderById(Guid id)
        {
            var order = await _orderRepository.GetById(id);
            if (order == null) return null;

            return new OrderDto
            {
                Id = order.Id,
                Description = order.Description,
                Amount = order.Amount,
                CreatedAt = order.CreatedAt,
                CustomerId = order.CustomerId,
                CustomerName = order.Customer.Name
            };
        }

        public async Task<OrderDto> CreateOrder(Guid customerId, string description, decimal amount)
        {
            var customer = await _customerRepository.GetById(customerId);
            if (customer == null)
            {
                throw new InvalidOperationException("Customer not found");
            }

            var order = new Order
            {
                CustomerId = customerId,
                Description = description,
                Amount = amount,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _orderRepository.Create(order);

            return new OrderDto
            {
                Id = created.Id,
                Description = created.Description,
                Amount = created.Amount,
                CreatedAt = created.CreatedAt,
                CustomerId = customerId,
                CustomerName = customer.Name
            };
        }

        public async Task DeleteOrder(Guid id)
        {
            await _orderRepository.Delete(id);
        }
    }
}
