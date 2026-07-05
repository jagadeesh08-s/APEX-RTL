module unoptimized_alu(
    input clk,
    input rst_n,
    input [3:0] op,
    input [15:0] a,
    input [15:0] b,
    output reg [31:0] result,
    output reg overflow
);

    reg [31:0] temp_mult;
    reg [15:0] a_reg1, a_reg2; // Redundant registers
    reg [15:0] b_reg1, b_reg2; // Redundant registers

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            a_reg1 <= 0;
            a_reg2 <= 0;
            b_reg1 <= 0;
            b_reg2 <= 0;
        end else begin
            a_reg1 <= a;
            a_reg2 <= a_reg1; // Redundant pipeline stage
            b_reg1 <= b;
            b_reg2 <= b_reg1; // Redundant pipeline stage
        end
    end

    // Combinational logic with deep nesting and complex operators
    always @(*) begin
        result = 0;
        overflow = 0;
        
        // Deeply nested if-else (produces priority encoders instead of parallel MUXes)
        if (op == 4'b0000) begin
            result = a_reg2 + b_reg2;
            if (result[16]) overflow = 1;
        end else begin
            if (op == 4'b0001) begin
                result = a_reg2 - b_reg2;
                if (a_reg2 < b_reg2) overflow = 1;
            end else begin
                if (op == 4'b0010) begin
                    // Big combinational multiplication (high delay critical path)
                    result = a_reg2 * b_reg2;
                end else begin
                    if (op == 4'b0011) begin
                        result = a_reg2 & b_reg2;
                    end else begin
                        if (op == 4'b0100) begin
                            result = a_reg2 | b_reg2;
                        end else begin
                            if (op == 4'b0101) begin
                                result = a_reg2 ^ b_reg2;
                            end else begin
                                if (op == 4'b0110) begin
                                    result = ~a_reg2;
                                end else begin
                                    if (op == 4'b0111) begin
                                        result = a_reg2 << b_reg2[3:0];
                                    end else begin
                                        result = 32'hFFFFFFFF; // Default case
                                    end
                                end
                            end
                        end
                    end
                end
            end
        end
    end

endmodule
