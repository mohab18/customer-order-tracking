using CustomerOrderTracking.DTOs;

namespace CustomerOrderTracking.Services
{
    public interface ICustomerService
    {
        Task<List<CustomerDto>> GetAllCustomers();
        Task<CustomerDto?> GetCustomerById(Guid id);
        Task<CustomerDto> CreateCustomer(CreateCustomerDto dto);
        Task UpdateCustomer(Guid id, UpdateCustomerDto dto);
        Task DeleteCustomer(Guid id);
    }
}
