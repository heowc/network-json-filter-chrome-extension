var logArea = document.querySelector('#log-area');

chrome.devtools.network.onRequestFinished.addListener(request => {
  var contentType = request.response.headers.filter(it => it.name === 'content-type')[0];
  if (contentType['value'].indexOf('application/json') === -1) {
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
      document.querySelector('#log-area').append(content);
    } else {
      var actual = jsonpath.query(JSON.parse(content), expressionValue)
      print(JSON.stringify(actual));
    }
  });
});

function print(value) {
  var spanNode = document.createElement("span");
  spanNode.textContent = '▼';
  spanNode.dataset.display = 'true';
  spanNode.addEventListener('click', function(e) {
    console.log(this.dataset);
    if (this.dataset.display === 'true') {
      this.textContent = '►';
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
}

document.querySelector('#clear').addEventListener('click', function(e) {
  logArea.innerHTML = '';
});