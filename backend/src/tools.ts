// ⚪ Names the return shape so the chain below reads clearly. TS detail — know its job.
type Weather = { tempC: number; condition: string };

// ⚪ SDK types for describing a tool to the model. Lookup-able syntax.
import { Type, type FunctionDeclaration } from "@google/genai";

// 🔵 PATTERN: this schema is the model's ONLY knowledge of the tool. The `description`
// and param names are how it decides WHEN to call it and WHAT to pass. `name` must match
// the real function exactly — that's the string we'll dispatch on in tick 3.
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "getWeather",
    description: "Get the current weather for a city.",
    parameters: {
      type: Type.OBJECT, // ⚪ SDK enum for "this takes an object of args"
      properties: {
        city: { type: Type.STRING, description: "City name, e.g. Paris" },
      },
      required: ["city"],
    },
  },
  {
    name: "recommendClothing",
    description: "Recommend what to wear for a given temperature in Celsius.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tempC: {
          type: Type.NUMBER,
          description: "Temperature in degrees Celsius",
        },
      },
      required: ["tempC"],
    },
  },
];

// ⚪ Canned data so the tool has something to return. Values are arbitrary; don't memorize.
const WEATHER_BY_CITY: Record<string, Weather> = {
  paris: { tempC: 12, condition: "cloudy" },
  london: { tempC: 9, condition: "rainy" },
  tokyo: { tempC: 24, condition: "sunny" },
  "new york": { tempC: 4, condition: "snowy" },
};

// 🔵 PATTERN: a "tool" is just a pure function the agent can ask us to run — no framework.
export function getWeather(city: string): Weather {
  const weather = WEATHER_BY_CITY[city.toLowerCase()]; // ⚪ normalize so "Paris" == "paris"
  // 🔵 PATTERN: throw on the unhappy path — surface failure instead of hiding it (feeds the error path in tick 6).
  if (!weather) throw new Error(`No weather data for "${city}"`);
  return weather;
}

// 🔵 PATTERN: the CHAIN — this takes the `tempC` that getWeather returns. Output-of-one = input-of-next.
export function recommendClothing(tempC: number): string {
  // ⚪ Arbitrary bands/advice. Know they map temp→string; the exact numbers don't matter.
  if (tempC < 10) return "a warm coat";
  if (tempC <= 20) return "a light jacket";
  return "a t-shirt";
}

// 🔵 PATTERN: the model asks for a tool BY NAME (a string, like "getWeather"). This maps
// that name to the real function and runs it — the bridge from "model requested a tool"
// to "our code actually runs." Every agent system has a step like this.
export function runTool(name: string, args: Record<string, any>): unknown {
  if (name === "getWeather") return getWeather(args.city);
  if (name === "recommendClothing") return recommendClothing(args.tempC);
  // ⚪ Safety: the model asked for a tool we don't have. Throw (feeds the error path later).
  throw new Error(`Unknown tool: ${name}`);
}
