namespace CustomerOrderTracking.DTOs
{
    public class CreateCustomerDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
