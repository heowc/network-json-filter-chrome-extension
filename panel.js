var DEFAULT_JSON = "{}";

var logArea = document.querySelector("#log-area");
var url = document.querySelector("#url");
var expression = document.querySelector("#expression");
var autoScroll = document.querySelector("#checkbox-autoscroll");
var autoClear = document.querySelector("#checkbox-autoclear");
var onOff = document.querySelector("#checkbox-onoff");
var pretty = document.querySelector("#checkbox-pretty");
var toggleAllBtn = document.querySelector("#toggle-all");

chrome.devtools.network.onRequestFinished.addListener((request) => {
  if (!isJsonType(request)) {
    return;
  }

  if (!onOff.checked) {
    return;
  }

  var urlValue = url.value;
  if (urlValue) {
    if (!request.request.url.includes(urlValue)) {
      return;
    }
  }

  request.getContent(function (content) {
    var expressionValue = expression.value;
    if (autoClear.checked) {
      logArea.innerHTML = "";
    }
    if (!expressionValue) {
      appendToPanel(content);
      return;
    }

    var result = jsonpath.query(JSON.parse(content), expressionValue);
    if (result.length > 0) {
      appendToPanel(JSON.stringify(result[0]));
    } else {
      appendToPanel(DEFAULT_JSON);
    }
  });
});

function isJsonType(request) {
  return request.response.content.mimeType === "application/json";
}

function appendToPanel(value) {
  var spanNode = generateSpan();
  var jsonStr;
  try {
    if (pretty.checked) {
      jsonStr = JSON.stringify(JSON.parse(value), undefined, 2);
    } else {
      jsonStr = JSON.stringify(JSON.parse(value));
    }
  } catch (e) {
    jsonStr = value;
  }
  var preNode = generatePre(jsonStr);
  var pNode = document.createElement("p");
  pNode.appendChild(spanNode);
  pNode.appendChild(preNode);
  var hrNode = document.createElement("hr");
  logArea.appendChild(pNode);
  logArea.appendChild(hrNode);
  if (autoScroll.checked) {
    hrNode.scrollIntoView();
  }
}

function generateSpan() {
  var spanNode = document.createElement("span");
  spanNode.className = "arrow";
  spanNode.textContent = "▼";
  spanNode.dataset.display = "true";
  spanNode.addEventListener("click", function (e) {
    if (this.dataset.display === "true") {
      this.textContent = "▶";
      this.dataset.display = "false";
      this.nextElementSibling.style = "display:none";
    } else {
      this.textContent = "▼";
      this.dataset.display = "true";
      this.nextElementSibling.style = "";
    }
  });
  return spanNode;
}

function generatePre(content) {
  var preNode = document.createElement("pre");
  preNode.textContent = content;
  return preNode;
}

// Global open/close all
var allOpen = true;
toggleAllBtn.addEventListener("click", function () {
  var arrows = logArea.querySelectorAll(".arrow");
  arrows.forEach(function (arrow) {
    if (allOpen) {
      arrow.textContent = "▶";
      arrow.dataset.display = "false";
      if (arrow.nextElementSibling)
        arrow.nextElementSibling.style = "display:none";
    } else {
      arrow.textContent = "▼";
      arrow.dataset.display = "true";
      if (arrow.nextElementSibling) arrow.nextElementSibling.style = "";
    }
  });
  allOpen = !allOpen;
  toggleAllBtn.textContent = allOpen ? "open(▼)/close(▶)" : "open(▼)/close(▶)";
});

// Clear button event
document.querySelector("#clear").addEventListener("click", function (e) {
  logArea.innerHTML = "";
});
