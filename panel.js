var logArea = document.querySelector('#log-area');

chrome.devtools.network.onRequestFinished.addListener(request => {
  if (!isJsonType(request)) {
    return;
  }

  var url = document.querySelector('#url');
  var urlValue = url.value;
  if (urlValue) {
    if (!request.request.url.includes(urlValue)) {
      return;
    }
  }

  var expression = document.querySelector('#expression');

  request.getContent(function (content) {
    var expressionValue = expression.value;
    if (!expressionValue) {
      print(content);
    } else {
      var actual = jsonpath.query(JSON.parse(content), expressionValue)
      print(JSON.stringify(actual));
    }
  });
});

function isJsonType(request) {
  return request.response.content.mimeType === 'application/json';
}

function print(value) {
  var spanNode = document.createElement("span");
  spanNode.className = 'arrow'
  spanNode.textContent = '▼';
  //spanNode.style = 'width:15px;height:15px;display:block;'
  spanNode.dataset.display = 'true';
  spanNode.addEventListener('click', function(e) {
    if (this.dataset.display === 'true') {
      this.textContent = '▶';
      this.dataset.display = 'false';
      this.nextElementSibling.style = 'display:none';
    } else {
      this.textContent = '▼';
      this.dataset.display = 'true';
      this.nextElementSibling.style = '';
    }
  });
  
  // json content
  var preNode = document.createElement("pre");
  preNode.textContent = JSON.stringify(JSON.parse(value), undefined, 2);
  // p
  var pNode = document.createElement("p");
  pNode.appendChild(spanNode);
  pNode.appendChild(preNode);
  // hr
  var hrNode = document.createElement("hr");
  
  logArea.appendChild(pNode);
  logArea.appendChild(hrNode);
  
  // focus
  hrNode.scrollIntoView();
}

document.querySelector('#clear').addEventListener('click', function(e) {
  logArea.innerHTML = '';
});