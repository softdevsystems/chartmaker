# SystemFlow Studio — Simplified Responsive Flat UI Edition

SystemFlow Studio is an offline HTML application for creating editable cross-functional swimlane flowcharts from written system requirements.

## What changed in this edition

- Removed the **Pages and Modules** section.
- Removed the **Project Check** section.
- Simplified the workflow into four clear sections: Project, Swimlanes, Flow, and Export.
- Kept the integrated Market Stall and Vendor Rental Collection sample.
- Retained the responsive Bootstrap 5 flat UI for desktop, tablet, and mobile devices.
- Kept the application fully offline by bundling Bootstrap locally.

## Main features

- Paste system requirements using one complete sentence per step.
- Dynamically detect standard and custom actors from sentence prefixes, including Teacher, Passenger, Driver, Student, Head, Rider, Collector, Cashier, Registrar, Administrator, System, services, databases, devices, and project-specific roles such as Municipal Engineer.
- Generate an editable first draft of the process.
- Add, remove, and reorder swimlanes.
- Create process, input/output, decision, database, document, subprocess, Start, and End shapes.
- Connect steps and add YES, NO, Approve, Submit, and other arrow labels.
- Drag chart nodes vertically and use automatic arrangement.
- Save the project in the browser.
- Export PNG, SVG, and editable JSON files.
- Import previously exported JSON projects.
- Print the generated chart.

## How to run

1. Extract the ZIP file.
2. Open the `systemflow_chart_generator` folder.
3. Double-click `index.html`.
4. Click **Market Sample** to inspect the included example or create a new project.

No web server, database, installation, or internet connection is required.

## Recommended student workflow

1. Enter the system title and description.
2. Paste the integrated process using one complete sentence per line.
3. Click **Analyze and Build Draft**.
4. Review and reorder the detected actors.
5. Correct the generated steps and connections.
6. Export the final chart as PNG, SVG, or JSON.

## Important note

The included analyzer is rule-based and works completely offline. For best actor recognition, start each sentence with the role, such as `Teacher: Records the grades.` or `Municipal Engineer approves the request.` The analyzer also recognizes many common role aliases and plural forms, but students must still verify the sequence, decisions, YES/NO branches, and final destinations.

## Included third-party library

Bootstrap 5.1.1 is bundled locally under `vendor/` and retains its original license header.


## Added update

- Click any chart shape to directly edit the flow step.
- Drag a shape vertically to adjust its position.

## Export update

- Added Export Word DOCX.
- Added Export PDF.
- Added Export Visio VSDX.
- The DOCX export includes the process steps and the chart image.
- The PDF export creates a fixed-layout chart file directly from the browser.
- The VSDX export creates a Visio Open Packaging file with generated pages and shapes.


Update notes:
- Export panel now shows PNG, SVG, PDF, and Print Chart only.
- DOCX, VSDX, JSON import/export, browser-save delete, and Prompt tab are removed from the visible UI.
- Top quick guide/quick tips are removed.
- Sidebar tabs are aligned into four equal sections.


## Dynamic actor recognition update

- Recognizes explicit actor formats such as `Teacher: Records grades.` and `Driver - Confirms the trip.`
- Recognizes natural sentences such as `The Passenger submits a booking.`
- Creates new swimlanes for custom roles that are not in the built-in catalog.
- Includes aliases and plural handling for Teacher, Passenger, Driver, Student, Head, Rider, Collector, Cashier, Registrar, and many other roles.
- Detects system components such as Database, SMS Service, Payment Gateway, Printer, Scanner, and External API.

### Verified role examples

The analyzer was tested with Teacher, System, Passenger, Driver, Student, School Head, Rider, Collector, Cashier, Registrar, Municipal Engineer, Barangay Captain, SMS Service, and Database steps. Custom roles are generated as new swimlanes when they begin a process sentence.


## Editable SVG import and Ultra HD PNG

- **Export Editable SVG** stores the full actors, steps, connections, descriptions, and manual positions inside SVG metadata.
- **Import SVG to Edit** restores SVG files exported by this updated Chart Builder. Ordinary SVG images without embedded project data remain view-only and cannot be reconstructed reliably.
- **Export Ultra HD PNG** rasterizes the vector chart at up to 4× resolution, subject to safe browser canvas limits. For unlimited zoom without pixelation, use the SVG export.

- Separate **Start Round** and **End Round** symbols matching standard activity-diagram notation.
- Start Round uses a solid black circle.
- End Round uses a solid black inner circle with a separate outer ring.
