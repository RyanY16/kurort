import Foundation
import Vision
import AppKit

guard CommandLine.arguments.count >= 2 else {
  fputs("Usage: ocr_image.swift image.png\n", stderr)
  exit(1)
}

let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
guard let image = NSImage(contentsOf: imageURL),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  fputs("Could not load image\n", stderr)
  exit(1)
}

let request = VNRecognizeTextRequest { request, error in
  if let error = error {
    fputs("OCR error: \(error.localizedDescription)\n", stderr)
    exit(1)
  }

  let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
  var rows: [[String: Any]] = []

  for observation in observations {
    guard let candidate = observation.topCandidates(1).first else { continue }
    let box = observation.boundingBox
    rows.append([
      "text": candidate.string,
      "confidence": candidate.confidence,
      "x": box.origin.x,
      "y": box.origin.y,
      "width": box.width,
      "height": box.height
    ])
  }

  if let data = try? JSONSerialization.data(withJSONObject: rows, options: [.prettyPrinted, .sortedKeys]),
     let output = String(data: data, encoding: .utf8) {
    print(output)
  }
}

request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.recognitionLanguages = ["ja-JP", "en-US"]

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try handler.perform([request])
