# CircuitBreakerPlanner
A simple web application for planning a circuit breaker layout or documenting an existing panel.

## Usage

Host on your own web server or access the planner on github.io here: [Circuit Breaker Planner Demo](https://bp2008.github.io/CircuitBreakerPlanner/CircuitBreakerPlanner/dist/index.html).

## Features

* Circuit Breaker Planner application designed for USA standard split-phase 120v AC residential panels with two columns of circuit breakers and a configurable number of rows.
* You can enter expected energy usage of circuits and the application will compute how much power is consumed on odd rows vs even rows, to help balance the panel.
* Labels can be printed for physical documentation of a panel layout.
* Application is JavaScript based and can be run in any modern web browser.  Run via any basic web server, or without a web server (open `dist/index.html`).
* Support for multiple electrical panel projects, e.g. one for your house, one for your workshop.
* Import and export projects as a string or QR code to share them between devices or to back them up.
* Flashy modern UI design.

## Implementation Details

Projects are stored in your browser's IndexedDB or Local Storage.

Application is built with Vue.js 2.x.
