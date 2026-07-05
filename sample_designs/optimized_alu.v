module optimized_alu(
    input clk,
    input rst_n,
    input [3:0] op,
    input [15:0] a,
    input [15:0] b,
    output reg [31:0] result,
    output reg overflow
);

    // Multiplier pipeline registers to break critical path delay
    reg [31:0] mult_stage1;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            mult_stage1 <= 0;
        end else begin
            mult_stage1 <= a * b; // 1 pipeline stage for multiplication
        end
    end

    // Use parallel case statement instead of nested priority encoders
    always @(*) begin
        result = 0;
        overflow = 0;
        
        case (op)
            4'b0000: begin // ADD
                result = a + b;
                if (result[16]) overflow = 1;
            end
            4'b0001: begin // SUB
                result = a - b;
                if (a < b) overflow = 1;
            end
            4'b0010: begin // MULT (Pipelined result from register)
                result = mult_stage1;
            end
            4'b0011: begin // AND
                result = a & b;
            end
            4'b0100: begin // OR
                result = a | b;
            end
            4'b0101: begin // XOR
                result = a ^ b;
            end
            4'b0110: begin // NOT
                result = ~a;
            end
            4'b0111: begin // SHL
                result = a << b[3:0];
            end
            default: begin
                result = 32'hFFFFFFFF;
            end
        endcase
    end

endmodule
