const express = require('express');
const fs = require('fs');
const util = require("util");
const app = express();
///////////////////////////////////////////ajouter la librairie socket.io
const server = require('http').createServer(app);
const io = require('./mes_modules/chat_socket').listen(server);
////////////////////////////////////////////////////////////////////
const bodyParser= require('body-parser');
const MongoClient = require('mongodb').MongoClient; // le pilote MongoDB
const ObjectID = require('mongodb').ObjectID;

const cookieParser = require('cookie-parser');
const i18n = require('i18n');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));

/* i18n */
i18n.configure({ 
   locales : ['fr', 'en'],
   cookie : 'langueChoisie', 
   directory : __dirname + '/locales'
})

app.use(cookieParser())
app.use(i18n.init);



let db // variable qui contiendra le lien sur la BD

MongoClient.connect('mongodb://127.0.0.1:27017', (err, database) => {
	
	 if (err) return console.log(err)
	 db = database.db('carnet_adresse')
	 console.log('connexion à la BD')

	// lancement du serveur Express sur le port 8081
	 server.listen(8081, (err) => {

	 	if (err) console.log(err)
		console.log('connexion à la BD et on écoute sur le port 8081')

	 })
})


/*
Les routes
*/

////////////////////////////////////////// Route /
app.set('view engine', 'ejs'); // générateur de template

app.get('/:locale(en|fr)', (req,res) =>{

	console.log("req.params.locale = " + req.params.locale)
	res.cookie('langueChoisie', req.params.locale)
	res.setLocale(req.params.locale)
	console.log(res.__('courriel'))

	console.log('Cookies: ', req.cookies.langueChoisie)

	res.redirect(req.get("referer"))

})


//////////////////////////////////////////
app.get('/', function (req, res) {
	console.log('*****************');
	console.log("req.cookies.langueChoisie = "  + req.cookies.langueChoisie)
	//console.log(res.__('courriel'))
	res.render('accueil.ejs')  
 
  });



//////////////////////////////////////////  Route Adresse
app.get('/adresse', function (req, res) {
   var cursor = db.collection('adresse')
                .find().toArray(function(err, resultat){
 if (err) return console.log(err)        
 res.render('adresse.ejs', {adresses: resultat})   
  });
})

//////////////////////////////////////////  Route Rechercher
app.post('/rechercher',  (req, res) => {

})
////////////////////////////////////////// Route /ajouter
app.post('/ajax_ajouter', (req, res) => {
console.log('route /ajouter')	
 db.collection('adresse').save(req.body, (err, result) => {
 if (err) return console.log(err)
 // console.log(req.body)	
 console.log('sauvegarder dans la BD')
  res.send(JSON.stringify(req.body));
 })
})

////////////////////////////////////////  Route /modifier
app.post('/ajax_modifier', (req, res) => {
 req.body._id = ObjectID(req.body._id)

   db.collection('adresse').save(req.body, (err, result) => {
   if (err) return console.log(err)
       console.log('sauvegarder dans la BD')
   res.send(JSON.stringify(req.body));
})
   
})


////////////////////////////////////////  Route /detruire
app.get('/ajax_detruire', (req, res) => {
 console.log('route /detruire')
 // console.log('util = ' + util.inspect(req.params));	
 var id = req.params.id
 console.log(id)
 db.collection('adresse').findOneAndDelete({"_id": ObjectID(req.params.id)}, (err, resultat) => {

if (err) return console.log(err)
res.send(JSON.stringify(req.body));
 })
})


///////////////////////////////////////////////////////////   Route /trier
app.get('/trier/:cle/:ordre', (req, res) => {

 let cle = req.params.cle
 let ordre = (req.params.ordre == 'asc' ? 1 : -1)
 let cursor = db.collection('adresse').find().sort(cle,ordre).toArray(function(err, resultat){

  ordre = (req.params.ordre == 'asc' ? 'desc' : 'asc')  
 res.render('adresse.ejs', {adresses: resultat, cle, ordre })	
})

}) 


/////////////////////////////////////////////////////////  Route /peupler
app.get('/vider', (req, res) => {

	let cursor = db.collection('adresse').drop((err, res)=>{
		if(err) console.error(err)
			console.log('ok')
			
		})
	res.redirect('/adresse')
})

//////////////////////////////////////////////////////// Route /clavardage


app.get('/chat', (req, res) => {

	res.render('socket_vue.ejs')
})