"use strict";
/**
 * Created by user on 2018/9/3/003.
 */
Object.defineProperty(exports, "__esModule", { value: true });
if (process && process.env) {
    process.env.FORCE_COLOR = process.env.FORCE_COLOR || '1';
}
const debug_color2_1 = require("debug-color2");
exports.console = new debug_color2_1.Console(null, {
    enabled: true,
    inspectOptions: {
        colors: true,
    },
    chalkOptions: {
        enabled: true,
    },
});
exports.console.enabledColor = true;
exports.default = exports.console;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsR0FBRyxFQUMxQjtJQUNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQztDQUN6RDtBQUVELCtDQUF1QztBQUMxQixRQUFBLE9BQU8sR0FBRyxJQUFJLHNCQUFPLENBQUMsSUFBSSxFQUFFO0lBQ3hDLE9BQU8sRUFBRSxJQUFJO0lBQ2IsY0FBYyxFQUFFO1FBQ2YsTUFBTSxFQUFFLElBQUk7S0FDWjtJQUNELFlBQVksRUFBRTtRQUNiLE9BQU8sRUFBRSxJQUFJO0tBQ2I7Q0FDRCxDQUFDLENBQUM7QUFFSCxlQUFPLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUU1QixrQkFBZSxlQUFPLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzkvMy8wMDMuXG4gKi9cblxuaWYgKHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYpXG57XG5cdHByb2Nlc3MuZW52LkZPUkNFX0NPTE9SID0gcHJvY2Vzcy5lbnYuRk9SQ0VfQ09MT1IgfHwgJzEnO1xufVxuXG5pbXBvcnQgeyBDb25zb2xlIH0gZnJvbSAnZGVidWctY29sb3IyJztcbmV4cG9ydCBjb25zdCBjb25zb2xlID0gbmV3IENvbnNvbGUobnVsbCwge1xuXHRlbmFibGVkOiB0cnVlLFxuXHRpbnNwZWN0T3B0aW9uczoge1xuXHRcdGNvbG9yczogdHJ1ZSxcblx0fSxcblx0Y2hhbGtPcHRpb25zOiB7XG5cdFx0ZW5hYmxlZDogdHJ1ZSxcblx0fSxcbn0pO1xuXG5jb25zb2xlLmVuYWJsZWRDb2xvciA9IHRydWU7XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnNvbGVcbiJdfQ==