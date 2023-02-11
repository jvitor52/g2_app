String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};

var app = angular.module("starter", [
  "ionic",
  "ionic-material",
  "ui.select",
  "ngSanitize",
  "ngCordova",
]);

app
  .run(function ($ionicPlatform, DatabaseValues, $rootScope, banco) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        console.log(window.cordova);
        alert("oi");
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });

    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function (transacao) {
      banco.executa(
        "CREATE TABLE IF NOT EXISTS usuario (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `nome` TEXT, `senha` TEXT);"
      );
      banco.executa(
        "create table if not exists plots (id integer primary key autoincrement,atividade text, bloco text, fazenda text,up text,talhao text,parcela text, area_talhao text, especie text, material text, espacamento text, plantio text, refime text, lado1 text, lado2 text, area_parcela text, tipo text, ciclo text, rotacao text, situacao text, medir text, status text, data_realizacao text, observacao text, zona_utm text, log_x text, lat_y text,alt_z text);"
      );

      banco.executa(
        "create table if not exists plots_lancamento (id integer primary key autoincrement,atividade text, bloco text, fazenda text,up text,talhao text,parcela text, area_talhao text, lado1 text, area_parcela text, tipo text, situacao text, medir text, status text, data_realizacao text, observacao text, zona_utm text, log_x text, lat_y text, lat TEXT, long TEXT,alt_z text, formato text, hora_inicio text, hora_fim text, responsavel INTEGER, sync INTEGER DEFAULT 0);"
      );
      banco.executa(
        "create table if not exists plots_lancamento_arv (id integer primary key autoincrement,plots_lancamento_id INTEGER, linha INTEGER, fim_linha TEXT, numero INTEGER, matrix TEXT, arvore INTEGER,dap FLOAT,altura FLOAT,dap2 FLOAT, alt_poda FLOAT, dominante TEXT, sync INTEGER DEFAULT 0);"
      );
    });

    $rootScope.incLancamentos = async function () {

      var sql = `SELECT * FROM plots`;
    
      var params = [];
      var resultado = await banco.executa(sql, params);
      var lista = Array.from(resultado.rows);

      if(lista.length == 0){
        banco.executa(
          `insert into plots (atividade, bloco, fazenda,up,talhao,parcela , area_talhao, especie, material, espacamento , plantio , refime, lado1 , lado2 , area_parcela , tipo , ciclo , rotacao , situacao , medir , status , data_realizacao , observacao , zona_utm , log_x, lat_y ,alt_z )
          values('IFC','IFC- TUR','VJQ - Campo Limpo IV','VJQ - Campo Limpo IV','VJ092','3','2000','','','','','','12,62','','500','I','','','','SIM','','','','23k','720897','8104089',''),
          ('IFC','IFC- TUR','VJQ - Campo Limpo IV','VJQ - Campo Limpo IV','VJ093','2','1850','','','','','','12,62','','400','I','','','','SIM','','','','23k','721499','8103968','');`
        );
      }else{
        console.log('encontrou registros');
      }

    };
    $rootScope.incLancamentos();
  })

  .controller("MyCtrl", function ($scope, $cordovaNetwork, $rootScope) { });

app.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $ionicConfigProvider.views.maxCache(0);

  $stateProvider

    .state("app", {
      url: "/app",
      abstract: true,
      templateUrl: "paginas/menu.html",
      controller: "AppCtrl",
    })

    .state("app.lists", {
      url: "/lists",
      views: {
        menuContent: {
          templateUrl: "paginas/lists.html",
          controller: "ListsCtrl",
        },
      },
    })

    .state("app.components", {
      url: "/components",
      views: {
        menuContent: {
          templateUrl: "paginas/components.html",
          controller: "ComponentsCtrl",
        },
      },
    })

    
    .state("app.lancamentoHome", {
      url: "/lancamentoHome",
      views: {
        menuContent: {
          templateUrl: "paginas/lancamento.html",
          controller: "LancamentoCtrl",
        },
      },
    })

    .state("app.listaTalhao", {
      url: "/listaTalhao/:fazenda",
      views: {
        menuContent: {
          templateUrl: "paginas/lista-talhao.html",
          controller: "ListaTalhaoCtrl",
        },
      },
    })

    .state("app.listaParcela", {
      url: "/listaParcela/:talhao",
      views: {
        menuContent: {
          templateUrl: "paginas/lista-parcela.html",
          controller: "ListaParcelaCtrl",
        },
      },
    })

    .state("app.inicio", {
      url: "/inicio",
      views: {
        menuContent: {
          templateUrl: "paginas/inicio.html",
          controller: "ComponentsCtrl",
        },
      },
    })

    .state("app.lancarParcela", {
      url: "/lancarParcela/:parcela",
      views: {
        menuContent: {
          templateUrl: "paginas/lancamento-parcela.html",
          controller: "ListaParcelaCtrl",
        },
      },
    })

    .state("app.lancarArvore", {
      url: "/lancarArvore/:lancamento",
      views: {
        menuContent: {
          templateUrl: "paginas/lancamento-arvores.html",
          controller: "ListaParcelaCtrl",
        },
      },
    })

    .state("app.finalizarParcela", {
      url: "/finalizarParcela/:lancamentoParcela",
      views: {
        menuContent: {
          templateUrl: "paginas/finalizar-lancamento.html",
          controller: "ListaParcelaCtrl",
        },
      },
    })

    .state("app.preCorteLista", {
      url: "/preCorteLista",
      views: {
        menuContent: {
          templateUrl: "paginas/pre-corte-lista.html",
          controller: "PreCorteListaCtrl",
        },
      },
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise("/app/components");
});

app.filter("cmdate", [
  "$filter",
  function ($filter) {
    return function (input, format) {
      var date = new Date(input);
      var localTime = date.getTime();
      var timezone = date.getTimezoneOffset() * 60000;
      var data2 = new Date(date - date.getTimezoneOffset() * 60000);
      return $filter("date")(new Date(localTime + timezone), format);
    };
  },
]);
app.filter("dataCompleta", [
  "$filter",
  function ($filter) {
    return function (input, format) {
      var date = new Date(input);
      //console.log(date);
      var localTime = date.getTime();
      var timezone = date.getTimezoneOffset() * 60000;
      var data2 = new Date(date - date.getTimezoneOffset() * 60000);

      if (input) {
        return $filter("date")(date, format);
      }

      return null;
    };
  },
]);
app
  .filter("cmtime", [
    "$filter",
    function ($filter) {
      return function (input, format) {
        return $filter("date")(new Date(input), format);
      };
    },
  ])
  .filter("cmCurrency", [
    "$filter",
    function ($filter) {
      return function (input) {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(input);
      };
    },
  ])

  .filter("os", [
    "$filter",
    function ($filter) {
      return function (input) {
        var str = "" + input;
        var pad = "0000";
        var mobile = "M1";
        return pad.substring(0, pad.length - str.length) + str;
      };
    },
  ])

  .filter("simounao", [
    "$filter",
    function ($filter) {
      return function (input) {
        return input ? "SIM" : "NÃO";
      };
    },
  ])
  .filter("propsFilter", function () {
    return function (items, props) {
      var out = [];

      if (angular.isArray(items)) {
        var keys = Object.keys(props);

        items.forEach(function (item) {
          var itemMatches = false;

          for (var i = 0; i < keys.length; i++) {
            var prop = keys[i];
            var text = props[prop].toLowerCase();
            if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
              itemMatches = true;
              break;
            }
          }

          if (itemMatches) {
            out.push(item);
          }
        });
      } else {
        // Let the output be the input untouched
        out = items;
      }

      return out;
    };
  });

app.directive("seletor", function ($ionicModal, $interpolate, $ionicLoading) {
  return {
    restrict: "E",
    transclude: true,
    scope: {
      ngModel: "=",
      change: "=",
      dados: "=",
      escolha: "@",
    },
    replace: true,
    template: `<button ng-click='abrir()' class="btn btn-block btn-seletor">
                            <ng-transclude></ng-transclude><i class="icon ion-android-arrow-dropdown-circle pull-right"></i>
                       </button>`,
    link(scope, ele, attrs) {
      scope.limpar = function () {
        scope.ngModel = null;

        console.log(scope.change);
        if (angular.isFunction(scope.change)) {
          scope.change();
        }
      };

      scope.selecionar = function (item) {
        scope.ngModel = item;

        if (angular.isFunction(scope.change)) {
          scope.change();
        }

        scope.ngModel = item;
        scope.modal.remove();
      };

      scope.exibirTexto = function (item) {
        var pattern = scope.escolha.replaceAll("{", "{{").replaceAll("}", "}}");
        return $interpolate(pattern)(item);
      };

      scope.fechar = function () {
        scope.modal.remove();
      };

      scope.buscarItens = async function (termo) {
        try {
          $ionicLoading.show({
            template:
              '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>',
          });

          scope.lista = await scope.dados(termo);
          $("#conteudo").scrollTop();

          $ionicLoading.hide();
        } catch (ex) {
          console.error(ex);
          alert("Erro ao buscar dados no seletor!");
        }
      };

      scope.abrir = async function () {
        try {
          scope.buscarItens();

          var template = `
                            <ion-view class='seletor'>
                                <ion-header-bar class="pantone-349c bar-assertive bar bar-header disable-user-behavior" align-title="center">
                                    <button class="button back-button buttons no-text button-clear header-item" ng-click="fechar()">
                                        <i class="icon ion-android-close"></i>                 
                                    </button>
                                    <div class="buttons buttons-left header-item" style=""><span class="left-buttons">
                                        <button class="button button-icon button-clear ion-navicon hide" menu-toggle="center"></button>
                                    </span></div>
                                    <div class="title title-center header-item">
                                        <div class="list">
                                        <button ng-show='ngModel' class='btn btn-primary btn-block'><i class="icon ion-android-checkbox-outline"></i> <span ng-bind-html="exibirTexto(ngModel)"></span></button>
                                            <label class="item item-input item-floating-label">
                                                <span class="input-label">Busca</span>
                                                <input ng-model='busca' ng-keyup='buscarItens(busca)' id='busca' type="text" placeholder="Busca">
                                            </label>
                                        </div>  
                                    </div>
                                    <button class="button back-button buttons no-text button-clear header-item" style='top: 0px; right: 0px;' ng-click="limpar()">
                                        <i class="icon ion-ios-trash"></i>                 
                                    </button>                                                              
                                </ion-header-bar>
    
                                <ion-content id='conteudo' class="padding">  
                                    <br><br>
                                    <h4 class="border-top"><i class="icon ion-android-list"></i> Resultado</h4>
                                    <div class="list">
                                        <div ng-repeat='item in lista'>
                                            <a class="item item-icon-left" ng-click='selecionar(item)'>
                                                <i ng-show='ngModel.id === item.id' class="icon ion-android-checkbox-outline"></i>
                                                <i ng-show='ngModel.id != item.id' class="icon ion-android-checkbox-outline-blank"></i>
                                                <div ng-bind-html="exibirTexto(item)"></div>
                                            </a>                                    
                                            <hr>   
                                        </div>
                                    </div>
                                </ion-content>                            
                            </ion-view>
                        `;

          var promise = $ionicModal.fromTemplate(template, {
            scope: scope,
            animation: "slide-in-up",
          });

          scope.modal = await promise;
          scope.modal.show();

          $("#busca").focus();
        } catch (ex) {
          console.error(ex);
          alert("Erro ao exibir tela do seletor.");
        }
      };
    },
  };
});
