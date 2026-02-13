using CustomerOrderTracking.Data;
using CustomerOrderTracking.DTOs;
using CustomerOrderTracking.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerOrderTracking.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public OrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<Order>> GetCustomerOrders(Guid customerId, OrderFilterDto filter)
        {
            var query = _context.Orders
                .Where(o => o.CustomerId == customerId)
                .Include(o => o.Customer)
                .AsQueryable();

            // Apply filters
            if (filter.StartDate.HasValue)
                query = query.Where(o => o.CreatedAt >= filter.StartDate.Value);

            if (filter.EndDate.HasValue)
                query = query.Where(o => o.CreatedAt <= filter.EndDate.Value);

            if (filter.MinAmount.HasValue)
                query = query.Where(o => o.Amount >= filter.MinAmount.Value);

            if (filter.MaxAmount.HasValue)
                query = query.Where(o => o.Amount <= filter.MaxAmount.Value);

            var totalCount = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<Order>
            {
                Items = orders,
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<Order?> GetById(Guid id)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<Order> Create(Order order)
        {
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task Delete(Guid id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order != null)
            {
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
            }
        }
    }
}
