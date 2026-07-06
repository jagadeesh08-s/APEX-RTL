module fsm_bad(
    input clk,
    input rst_n,
    input start,
    input ready,
    output reg [1:0] out
);
    reg [2:0] state;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= 3'd0;
            out <= 2'b00;
        end else begin
            // Nested branching conditionals inside state logic
            if (state == 3'd0) begin
                if (start) begin
                    state <= 3'd1;
                end
            end else if (state == 3'd1) begin
                if (ready) begin
                    state <= 3'd2;
                    out <= 2'b01;
                end else if (!start) begin
                    state <= 3'd0;
                end
            end else if (state == 3'd2) begin
                if (ready) begin
                    state <= 3'd3;
                    out <= 2'b10;
                end
            end else if (state == 3'd3) begin
                state <= 3'd0;
                out <= 2'b11;
            end else begin
                state <= 3'd0;
            end
        end
    end
endmodule
