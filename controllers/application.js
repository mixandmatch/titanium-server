var ACS = require('acs-node');
ACS.init('VkqmqNRXbjTeXXzP8DQhTiiSTNFE20PH');

function index (req , res) {
	res.render('index' , {
		title: 'login successful'
	});

}