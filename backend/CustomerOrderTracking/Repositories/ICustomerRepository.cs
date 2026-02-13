using CustomerOrderTracking.Models;

namespace CustomerOrderTracking.Repositories
{
    public interface ICustomerRepository
    {
        Task<List<Customer>> GetAll();
        Task<Customer?> GetById(Guid id);
        Task<Customer> CreateCustomer(Customer customer);
        Task UpdateCustomer(Customer customer);
        Task DeleteCustomer(Guid id);
        Task<bool> EmailExists(string email, Guid? excludeId = null);

    }
}
