module multiplier_bad(
    input [15:0] a,
    input [15:0] b,
    output reg [31:0] y
);

always @(*) begin
    y = a * b; // Combinational multiplier path without pipeline stage
end

endmodule
