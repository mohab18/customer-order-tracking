using CustomerOrderTracking.BackgroundServices;
using CustomerOrderTracking.DTOs;
using CustomerOrderTracking.Models;
using CustomerOrderTracking.Repositories;

namespace CustomerOrderTracking.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _customerRepository; 
        private readonly OrderGenerationService _orderGenerationService;
        public CustomerService(ICustomerRepository customerRepository , OrderGenerationService orderGenerationService)
        {
            _customerRepository = customerRepository;
            _orderGenerationService = orderGenerationService;
        }

        public async Task<List<CustomerDto>> GetAllCustomers()
        {
            var customers = await _customerRepository.GetAll();

            return customers.Select(c => new CustomerDto
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                TotalOrders = c.Orders.Count,
                LatestOrderTime = c.Orders.OrderByDescending(o => o.CreatedAt)
                    .Select(o => (DateTime?)o.CreatedAt)
                    .FirstOrDefault()
            }).ToList();
        }

        public async Task<CustomerDto?> GetCustomerById(Guid id)
        {
            var customer = await _customerRepository.GetById(id);
            if (customer == null) return null;

            return new CustomerDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                IsActive = customer.IsActive,
                CreatedAt = customer.CreatedAt,
                TotalOrders = customer.Orders.Count,
                LatestOrderTime = customer.Orders.OrderByDescending(o => o.CreatedAt)
                    .Select(o => (DateTime?)o.CreatedAt)
                    .FirstOrDefault()
            };
        }

        public async Task<CustomerDto> CreateCustomer(CreateCustomerDto dto)
        {
            // Check if email exists
            if (await _customerRepository.EmailExists(dto.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            var customer = new Customer
            {
                Name = dto.Name,
                Email = dto.Email,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _customerRepository.CreateCustomer(customer);
            _orderGenerationService.StartOrderGeneration(customer.Id);

            return new CustomerDto
            {
                Id = created.Id,
                Name = created.Name,
                Email = created.Email,
                IsActive = created.IsActive,
                CreatedAt = created.CreatedAt,
                TotalOrders = 0,
                LatestOrderTime = null
            };
        }

        public async Task UpdateCustomer(Guid id, UpdateCustomerDto dto)
        {
            var customer = await _customerRepository.GetById(id);
            if (customer == null)
            {
                throw new InvalidOperationException("Customer not found");
            }

       
            if (customer.Email != dto.Email && await _customerRepository.EmailExists(dto.Email, id))
            {
                throw new InvalidOperationException("Email already exists");
            }
            var wasActive = customer.IsActive;

            customer.Name = dto.Name;
            customer.Email = dto.Email;
            customer.IsActive = dto.IsActive;

            await _customerRepository.UpdateCustomer(customer);
            if (customer.IsActive && !wasActive)
            {
                _orderGenerationService.StartOrderGeneration(id);
            }
            else if (!customer.IsActive && wasActive)
            {
                _orderGenerationService.StopOrderGeneration(id);
            }
        }

        public async Task DeleteCustomer(Guid id)
        {
            _orderGenerationService.StopOrderGeneration(id);
            await _customerRepository.DeleteCustomer(id);
        }
    }
}
