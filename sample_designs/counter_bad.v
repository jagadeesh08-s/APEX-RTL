module counter_bad(
    input clk,
    input rst_n,
    input up_down,
    input enable,
    output reg [7:0] count
);

always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        count <= 8'd0;
    end else begin
        // Redundant branching and nested ifs inside counter logic
        if (enable) begin
            if (up_down) begin
                if (count == 8'd255) begin
                    count <= 8'd0;
                end else begin
                    count <= count + 8'd1;
                end
            end else begin
                if (count == 8'd0) begin
                    count <= 8'd255;
                end else begin
                    count <= count - 8'd1;
                end
            end
        end
    end
end

endmodule
