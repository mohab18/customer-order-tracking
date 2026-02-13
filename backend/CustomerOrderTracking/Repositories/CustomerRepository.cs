using CustomerOrderTracking.Data;
using CustomerOrderTracking.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerOrderTracking.Repositories
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly ApplicationDbContext _context;

        public CustomerRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Customer>> GetAll()
        {
            return await _context.Customers
                .Include(c => c.Orders)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Customer?> GetById(Guid id)
        {
            return await _context.Customers
                .Include(c => c.Orders)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Customer> CreateCustomer(Customer customer)
        {
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        public async Task UpdateCustomer(Customer customer)
        {
            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCustomer(Guid id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer != null)
            {
                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync();
            }
        }
        public async Task<bool> EmailExists(string email, Guid? excludeId = null)
        {
            if (excludeId.HasValue)
            {
                return await _context.Customers.AnyAsync(c => c.Email == email && c.Id != excludeId.Value);
            }
            return await _context.Customers.AnyAsync(c => c.Email == email);
        }

    }
}
