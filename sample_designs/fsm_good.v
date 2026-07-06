module fsm_good(
    input clk,
    input rst_n,
    input start,
    input ready,
    output reg [1:0] out
);
    localparam STATE_IDLE = 2'b00;
    localparam STATE_RUN  = 2'b01;
    localparam STATE_WAIT = 2'b10;
    localparam STATE_DONE = 2'b11;

    reg [1:0] curr_state, next_state;

    // Sequential state transfer
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            curr_state <= STATE_IDLE;
        end else begin
            curr_state <= next_state;
        end
    end

    // Parallel case state transition logic
    always @(*) begin
        next_state = curr_state;
        out = 2'b00;
        case (curr_state)
            STATE_IDLE: begin
                if (start) next_state = STATE_RUN;
            end
            STATE_RUN: begin
                if (ready) begin
                    next_state = STATE_WAIT;
                    out = 2'b01;
                end else if (!start) begin
                    next_state = STATE_IDLE;
                end
            end
            STATE_WAIT: begin
                if (ready) begin
                    next_state = STATE_DONE;
                    out = 2'b10;
                end
            end
            STATE_DONE: begin
                next_state = STATE_IDLE;
                out = 2'b11;
            end
            default: next_state = STATE_IDLE;
        endcase
    end
endmodule
