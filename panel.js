var DEFAULT_JSON = "{}";

var logArea = document.querySelector("#log-area");
var url = document.querySelector("#url");
var expression = document.querySelector("#expression");
var followTail = document.querySelector("#checkbox-follow-tail");

function urlMatches(requestUrl, filter) {
  if (!filter) return true;
  // RegExp: starts and ends with /
  if (
    filter.length > 2 &&
    filter[0] === "/" &&
    filter[filter.length - 1] === "/"
  ) {
    try {
      var re = new RegExp(filter.slice(1, -1));
      return re.test(requestUrl);
    } catch (e) {
      return false;
    }
  }
  // Glob: contains * or ?
  if (filter.includes("*") || filter.includes("?")) {
    // Escape regex special chars except * and ?
    var globToRegex = filter
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    try {
      var re = new RegExp("^" + globToRegex + "$");
      return re.test(requestUrl);
    } catch (e) {
      return false;
    }
  }
  // Substring
  return requestUrl.includes(filter);
}

chrome.devtools.network.onRequestFinished.addListener((request) => {
  if (!isJsonType(request)) {
    return;
  }

  var urlValue = url.value;
  if (urlValue) {
    if (!urlMatches(request.request.url, urlValue)) {
      return;
    }
  }

  request.getContent(function (content) {
    var expressionValue = expression.value;
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
  // span
  var spanNode = generateSpan();
  // pre(json content)
  var preNode = generatePre(JSON.stringify(JSON.parse(value), undefined, 2));
  // p
  var pNode = document.createElement("p");
  pNode.appendChild(spanNode);
  pNode.appendChild(preNode);
  // hr
  var hrNode = document.createElement("hr");

  logArea.appendChild(pNode);
  logArea.appendChild(hrNode);

  // focus
  if (followTail.checked) {
    hrNode.scrollIntoView();
  }
}

function generateSpan() {
  var spanNode = document.createElement("span");
  spanNode.className = "arrow";
  spanNode.textContent = "▼";
  //spanNode.style = 'width:15px;height:15px;display:block;'
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

/* =========================== event =========================== */
document.querySelector("#clear").addEventListener("click", function (e) {
  logArea.innerHTML = "";
});
