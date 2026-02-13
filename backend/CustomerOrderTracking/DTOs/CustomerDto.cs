namespace CustomerOrderTracking.DTOs
{
    public class CustomerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalOrders { get; set; }
        public DateTime? LatestOrderTime { get; set; }
    }
}
