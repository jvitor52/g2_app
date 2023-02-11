import {Page} from 'ionic/ionic';
import {Http} from 'angular2/http';

@Page({
 templateUrl: 'js/controllers/components.html',
})


 export class HomePage {
    constructor(http: Http) {
        this.data = {};
        this.data.username = '';
        this.data.response = '';
 
        this.http = http;
    }
 
   submit() {
        var link = 'http://cambioseguro.com.br/index.php';
        var data = JSON.stringify({json: this.data.json});
        
        this.http.post(link, data)
        .subscribe(data => {
         this.data.response = data._body;
        }, error => {
            console.log("Oooops!");
        });
      }
    }
   
    var userDetails = {
                        "username":"vikash|214057357158656",
                        "password":"gbadmin"
                       }
    $scope.login = function() {
     $http.post("http://redmine.youtility.in:8282/services/Login3.0",userDetails)
    .success (function(response){
        console.log(response);
     }
     .error(function(response){
        console.log(response);
     };
    }
    console.log(response)
