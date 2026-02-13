namespace CustomerOrderTracking.DTOs
{
    public class OrderDto
    {
        public Guid Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
    }
}
