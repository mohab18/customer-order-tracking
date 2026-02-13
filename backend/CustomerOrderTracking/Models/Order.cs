namespace CustomerOrderTracking.Models
{
    public class Order
    {
        public Guid Id { get; set; } 
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        
        public Guid CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;
    }
}
