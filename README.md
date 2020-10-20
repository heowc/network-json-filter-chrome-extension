# network-json-filter-chrome-extension

Network Response (JSON Body) Filter as Google Chrome Extension.

# Install

[here](https://chrome.google.com/webstore/detail/network-json-filter/flcfiogpdlddkjiekpeiedkeoihppekm)

# Screenshot

![img screenshot](./docs/screenshot.png)

# Usage

- url: If there is a value, filter the URL. It simply determines if it contains a string.
- expression: If there is a value, the json-path format is used to convert the network response value to the desired value. Please refer to the [json-path](https://github.com/json-path/JsonPath).