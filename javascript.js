// Initialize Firebase
var config = {
	apiKey: "AIzaSyBZpvj4-4Ge0cncdMYqFwa3MvmacZW3vxE",
	authDomain: "rock-paper-scissors-11f5c.firebaseapp.com",
	databaseURL: "https://rock-paper-scissors-11f5c.firebaseio.com",
	projectId: "rock-paper-scissors-11f5c",
	storageBucket: "rock-paper-scissors-11f5c.appspot.com",
	messagingSenderId: "394689197911"
};
firebase.initializeApp(config);

var database = firebase.database();
var connectedRef = database.ref(".info/connected");
var usersRef = database.ref("/users"); 

var choice = "";
var player;
var choiceRef;
var oppChoice = "";
var oppChoiceRef;
var userCount = 1;
var userID;
var userNumber;


/**************************************************
SET UP PLAYERS
**************************************************/

// When new user is detected, add user to users list.
connectedRef.on("value", function(snap) {
  if (snap.val()) {
  	var con = usersRef.push(true);
  	con.onDisconnect().remove()
  	//  Get user id for use in assigning a number.
  	userID = con.key;
  	//console.log(userID);
  }
});

// Assign new user's userNumber to the current total number of users (i.e. add to end of queue).
usersRef.once("value", function(snap){
	userCount = snap.numChildren();
	usersRef.child(userID).set({
		userNumber : userCount
	});
	assignPlayers();
});

// When browser is closed, rewrite user numbers to reflect change in queue.
usersRef.on("child_removed", function(removedChildSnap) {
	if (removedChildSnap.val().userNumber === 1) {
		console.log(choice)
		database.ref("/playerChoices/p1Choice").set({
			choice: choice
		});
		database.ref("/playerChoices/p2Choice").set({
			choice: ""
		});
		oppChoice = "";

	}
	else if (removedChildSnap.val().userNumber === 2) {
		database.ref("/playerChoices/p2Choice").set({
			choice: ""
		});
		oppChoice = "";
	};
	usersRef.once("value", function(snap) {
		var newCount = 1;
		console.log(snap.val());
		for (var key in snap.val()) {
	      	database.ref("/users/" + key).set({
	      		userNumber : newCount
	      	});
	      	newCount++;			
		};
    });
    assignPlayers();
});

function assignPlayers(){

	usersRef.once("value", function(snap){
		var data = snap.val();
		
		if (data[userID].userNumber === 1) {
			console.log("you are user 1");
			player = userID;
			choiceRef = "p1Choice";
			oppChoiceRef = "p2Choice";
		}
		else if (data[userID].userNumber === 2) {
			console.log("you are user 2");
			player = userID;
			choiceRef = "p2Choice";
			oppChoiceRef = "p1Choice";
		};
	});
};


/***************************************
PLAY GAME
***************************************/

$(".card").on("click", function(){
	
	choice = $(this).attr("id");
	$(".holder").css("display", "none");
	$("#holder-"+choice).css("display", "inline-block");
	
	// If the user is the first or second player
	if (userID === player) {
		// Go to database and set player's choice to player's local selection
		
		// LOSING THIS DATABASE CALL FIXED THE ISSUE WHERE THE CARD GETS STUCK IF PLAYER 2 PICKS FIRST
		// database.ref("/playerChoices").once("value", function(snap){
			database.ref("/playerChoices/"+ choiceRef).set({choice});
		// });

		// Listen for opponent to choose
		// What if opponent has already chosen?
		database.ref("/playerChoices/" + oppChoiceRef).on("value", function(snap){
			oppChoice = snap.val().choice;
			$("#holder-"+ oppChoice).css("display", "inline-block");
			console.log("Your choice is " + choice);
			console.log("oppChoice is " + oppChoice);

			// If both players have chosen
			if (oppChoice!="" && choice !="") {
				console.log("Before getResult(), choice " + choice + " vs " + "oppChoice " + oppChoice)
				// If these references aren't passed in, it sets them to empty for some reason
				getResult(choice, oppChoice);
				// Reset all to empty so that choices don't default to former when opponent choses before you
				choice = "";
				database.ref("/playerChoices/" + choiceRef).set({
					choice: ""
				});
				oppChoice = "";
				// Wait to see both choices before resetting
				setTimeout(function(){
					$("#instructions").text("Choose a card.");
		  			$(".holder").css("display", "inline-block");
				}, 1000*5);
				return;
			}
			// Ideally, I'd prefer this to never be true... but sometimes it is. Not really a big deal.
			else if (choice === "") {
				$("#instructions").text("Want to avoid this being true")
			}
			else {
				$("#instructions").text("Wait for other player's choice");
			}
		});
	return;
	}
	else {
		$("#instructions").text("You are not player one or two. Please wait to play.")
	};
	
	

});


function getResult(choice, oppChoice) {
	database.ref("/playerChoices").once("value", function(snap){
		console.log("In getResult(), choice " + choice + " vs " + "oppChoice " + oppChoice)
		if (choice === oppChoice) {
			$("#instructions").text("It's a tie!");
			console.log("its a tie")
	  	} else if ( (choice ==='rock' && oppChoice === 'scissors') 
	  		|| (choice ==='paper' && oppChoice === 'rock') 
	  		|| (choice ==='scissors' && oppChoice === 'paper') ) {
	  		$("#instructions").text("You win!");
	  		console.log(choiceRef + " is the winner")
	  	} else {
	  		$("#instructions").text("You lose!");
	  		console.log(choiceRef + " is the loser")
	  	};
  	});
};

/***************************************
ANIMATION
***************************************/

$(document).on({
	mouseenter : function() {
		$(this).animate({
			top: "-=3px",
			left: "-=3px",
			height: 306,
			width: 206
		},  {duration: 200,
			queue : false});
		$("html, body").css("cursor", "pointer");
	},
	mouseleave : function(){
		$(this).animate({
			top: "+0px",
			left: "+0px",
			height: 300,
			width: 200
		},  {duration: 200,
			queue : false});
		$("html, body").css("cursor", "default");
	},
	click : function(){
		$("html, body").css("cursor", "default");
	}
}, ".card");
