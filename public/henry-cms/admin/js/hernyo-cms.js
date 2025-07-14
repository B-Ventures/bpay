/* Hernyo CMS */
(function() {

  "use strict";
  window.addEventListener("load", function() {
    var form = document.getElementById("needs-validation");
    form.addEventListener("submit", function(event) {
      if (form.checkValidity() == false) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    }, false);
  }, false);

	var remover = document.querySelector('#page-remove-form');
	if (!!remover) {
		remover.onsubmit = function() {
			return confirm('You are about to remove the page, are you sure?!');
		}
	}
	var message = document.querySelector('#message');
	if (!!message) {
		setTimeout(function(){
			message.classList.add('fade');
		}, 2000);
	}

    var fileremover = document.querySelectorAll('.remove-file-button');
	if (!!fileremover) {
		console.log('items');
		for ( var i=0; i<fileremover.length; i++) {
			fileremover[i].onclick = function() {
				return confirm('You are about to remove the file, are you sure?!');
			}
		}
	}

})();
