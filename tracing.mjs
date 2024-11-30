import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

// Enable diagnostic logging (optional)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const traceExporter = new OTLPTraceExporter({
  url: "http://<collector-endpoint>/v1/traces", // Replace with your backend's endpoint
});

// Configure the SDK
const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  // traceExporter: traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start the SDK
sdk.start();

// Graceful shutdown
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("OpenTelemetry shut down"))
    .catch((err) => console.error("Error shutting down OpenTelemetry", err))
    .finally(() => process.exit(0));
});
