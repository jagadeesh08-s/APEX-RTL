module multiplier_good(
    input clk,
    input [15:0] a,
    input [15:0] b,
    output reg [31:0] y
);

reg [31:0] mult_stage;

always @(posedge clk) begin
    mult_stage <= a * b; // Intermediate register pipeline stage
    y <= mult_stage;
end

endmodule
