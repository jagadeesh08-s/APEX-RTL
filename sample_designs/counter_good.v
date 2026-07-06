module counter_good(
    input clk,
    input rst_n,
    input up_down,
    input enable,
    output reg [7:0] count
);

always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        count <= 8'd0;
    end else if (enable) begin
        // Optimized flattened logic
        count <= up_down ? (count + 8'd1) : (count - 8'd1);
    end
end

endmodule
