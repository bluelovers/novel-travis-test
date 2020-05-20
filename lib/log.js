"use strict";
/**
 * Created by user on 2018/9/3/003.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.console = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLEdBQUcsRUFDMUI7SUFDQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxHQUFHLENBQUM7Q0FDekQ7QUFFRCwrQ0FBdUM7QUFDMUIsUUFBQSxPQUFPLEdBQUcsSUFBSSxzQkFBTyxDQUFDLElBQUksRUFBRTtJQUN4QyxPQUFPLEVBQUUsSUFBSTtJQUNiLGNBQWMsRUFBRTtRQUNmLE1BQU0sRUFBRSxJQUFJO0tBQ1o7SUFDRCxZQUFZLEVBQUU7UUFDYixPQUFPLEVBQUUsSUFBSTtLQUNiO0NBQ0QsQ0FBQyxDQUFDO0FBRUgsZUFBTyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFFNUIsa0JBQWUsZUFBTyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC85LzMvMDAzLlxuICovXG5cbmlmIChwcm9jZXNzICYmIHByb2Nlc3MuZW52KVxue1xuXHRwcm9jZXNzLmVudi5GT1JDRV9DT0xPUiA9IHByb2Nlc3MuZW52LkZPUkNFX0NPTE9SIHx8ICcxJztcbn1cblxuaW1wb3J0IHsgQ29uc29sZSB9IGZyb20gJ2RlYnVnLWNvbG9yMic7XG5leHBvcnQgY29uc3QgY29uc29sZSA9IG5ldyBDb25zb2xlKG51bGwsIHtcblx0ZW5hYmxlZDogdHJ1ZSxcblx0aW5zcGVjdE9wdGlvbnM6IHtcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0sXG5cdGNoYWxrT3B0aW9uczoge1xuXHRcdGVuYWJsZWQ6IHRydWUsXG5cdH0sXG59KTtcblxuY29uc29sZS5lbmFibGVkQ29sb3IgPSB0cnVlO1xuXG5leHBvcnQgZGVmYXVsdCBjb25zb2xlXG4iXX0=