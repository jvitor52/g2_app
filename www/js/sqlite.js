var db = null;
var sqlite = angular.module('sqlite', ['ionic', 'ngCordova']);

sqlite.run(function ($ionicPlatform, $cordovaSQLite) {
    $ionicPlatform.ready(function () {
        if (window.cordova && window.SQLitePlugin) {
            db = $cordovaSQLite.openDB({name: "silvicultura", location: "default"});
        } else {
            db = window.openDatabase("silvicultura", '1', 'silvicultura', 1024 * 1024 * 100);
        }

        db.transaction(function (tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS 'unidade' ( codigo INTEGER PRIMARY KEY, sigla VARCHAR(3), nome TEXT)");

            tx.executeSql("CREATE TABLE IF NOT EXISTS 'lancamento' ( codigo INTEGER PRIMARY KEY, data DATE, projeto_id INT, subprojeto_id INT, talhao TEXT, operacao TEXT, area INT, unidade_id INT, areacheck BOOLEAN)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS 'componente' ( codigo INTEGER PRIMARY KEY, fornecedor_id INT, componente_id INT, custounit FLOAT, qtdpagamento FLOAT, custototal FLOAT, rendimento FLOAT, lancamento_id INT)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS 'comunicado' ( codigo INTEGER PRIMARY KEY, comentario TEXT, talhao TEXT, total FLOAT, unidade_id INT, projeto_id INT, subprojeto_id INT)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS 'foto' ( codigo INTEGER PRIMARY KEY, observacao TEXT, foto TEXT, comunicado_id INT, inspecao_id INT)");

            tx.executeSql("CREATE TABLE IF NOT EXISTS 'planejamento' ( codigo INTEGER PRIMARY KEY, numero INT, dtabertura DATE, fornecedor_id INT, mesini INT, mesfim INT, atvini INT, ativfim INT, prazo INT, formpagamento INT, vloperacoes FLOAT, desconto FLOAT, acrescimo FLOAT, vlfinal FLOAT)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS 'diagnostico' ( codigo INTEGER PRIMARY KEY, projeto_id INT, subprojeto_id INT, condicao_id INT, declividade_id INT, especie_id INT, ocupacao_id INT, potencial_id INT)");

            // tx.executeSql("CREATE TABLE IF NOT EXISTS 'inspecao' ( codigo INTEGER PRIMARY KEY, data DATE, empresa TEXT, tecnico TEXT, talhao TEXT, reservatorio_id INT, municipio_id INT, observacao TEXT)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS 'inspecao' ( codigo INTEGER PRIMARY KEY, data DATE, projeto_id INT, subprojeto_id INT, talhao TEXT, area FLOAT, prestador_id INT, planejamento_id INT, operacao_id INT, analise_id INT, latitude FLOAT, longitude FLOAT)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS 'parcela' ( codigo INTEGER PRIMARY KEY, inspecao_id INT, parcela FLOAT, qtdplantada INT, qtdmorta INT, area FLOAT, qtdviva INT, perda FLOAT)");


            // tx.executeSql ("INSERT INTO unidade (sigla, nome) VALUES (?, ?)",['UN', 'UNIDADE']);
            // db.transaction(function (tx) {
            //     tx.executeSql("INSERT INTO unidade (sigla, nome) VALUES (?, ?)", ['UN', 'UNIDADE'], function (tx, result) {
            //         console.log(result)
            //     });
            // });
            // tx.executeSql ("INSERT INTO unidade (sigla, nome) VALUES (?, ?)",['HA', 'HECTARES']);
            // tx.executeSql ("INSERT INTO unidade (sigla, nome) VALUES (?, ?)",['LT', 'LITROS']);
        });
        // $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS 'lancamento' ( codigo integer primary key, data date, projeto_id int, subprojeto_id int, talhao text, operacao int, area int, unidade_id int, areacheck boolean)");
    });
});

sqlite.factory('lancamentoFactory', function (componenteFactory) {
    return {
        insert: function (data, projeto_id, subprojeto_id, listTalhao, operacao, area, unidade_id, areacheck, componentes) {
            var query = "INSERT INTO lancamento (data, projeto_id, subprojeto_id, talhao, operacao, area, unidade_id, areacheck) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
            var values = [data, projeto_id, subprojeto_id, listTalhao, operacao, area, unidade_id, areacheck];
            var retorno = null;
            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                    retorno = result.insertId;
                    angular.forEach(componentes, function (componente) {
                        componenteFactory.insert(
                            componente.fornecedor_id.codigo, componente.componente_id.codigo, componente.custounit,
                            componente.qtdpagamento, componente.custototal, componente.rendimento,
                            result.insertId
                        );
                    })

                });
            });
            return retorno;
        },
        select: function () {
            var query = "SELECT * FROM lancamento";
            var resultado = [];
            db.transaction(function (tx) {
                tx.executeSql(query, [], function (tx, result) {
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log(error);
                    }
                );
            });
            return resultado;
        },
        delete: function (codigo) {
            var query = "DELETE FROM lancamento WHERE codigo = ?";
            var values = [codigo];
            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                    componenteFactory.delete(codigo);
                });
            });
        },
        getById: function (codigo) {
            var query = "SELECT * FROM lancamento WHERE codigo =?";
            var values = [codigo];
            var resultado = [];

            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                        var len = result.rows.length, i;
                        for (i = 0; i < len; i++) {
                            var row = result.rows.item(i);
                            resultado[0] = row;
                        }
                    },
                    function (tx, error) {
                        console.log('Deu errado!', error);
                    }
                );
            });

            return resultado;
        },
        update: function (codigo, data, projeto_id, subprojeto_id, listTalhao, operacao, area, unidade_id, areacheck, componentes) {
            var query = "UPDATE lancamento SET data = ?, projeto_id = ?, subprojeto_id = ?, talhao = ?, operacao = ?, area = ?, unidade_id = ?, areacheck = ? WHERE codigo = ?";
            var values = [data, projeto_id, subprojeto_id, listTalhao, operacao, area, unidade_id, areacheck, codigo];
            var retorno = null;
            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                    angular.forEach(componentes, function (componente) {
                        componenteFactory.insert(
                            componente.fornecedor_id, componente.componente_id, componente.custounit,
                            componente.qtdpagamento, componente.custototal, componente.rendimento,
                            codigo
                        );
                    });
                }, function (tx, err) {
                    console.log(err);
                });
            });
            return retorno;
        },
    }
});

sqlite.factory('unidadeFactory', function () {
    return {
        insert: function (sigla, nome) {
            var query = "INSERT INTO unidade (sigla, nome) VALUES (?, ?)";
            var values = [sigla, nome];
            var retorno = null;
            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                    console.log(result.insertId)
                    retorno = result.insertId;
                });
            });
            return retorno;
        },
        select: function () {
            var query = "SELECT * FROM unidade";
            var resultado = [];
            db.transaction(function (tx) {
                tx.executeSql(query, [], function (tx, result) {
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log("Error:", error);
                    }
                );
            });
            return resultado;
        },
    }
});

sqlite.factory('componenteFactory', function () {
    return {
        insert: function (fornecedor_id, componente_id, custounit, qtdpagamento, custototal, rendimento, codigolancamento) {
            var query = "INSERT INTO componente (fornecedor_id, componente_id, custounit, qtdpagamento, custototal, rendimento, lancamento_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
            var values = [fornecedor_id, componente_id, custounit, qtdpagamento, custototal, rendimento, codigolancamento];
            var retorno = null;
            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                    console.log(result.insertId)
                    retorno = result.insertId;
                });
            });
            return retorno;
        },
        select: function () {
            var query = "SELECT * FROM componente";
            var resultado = [];
            db.transaction(function (tx) {
                tx.executeSql(query, [], function (tx, result) {
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log("Error:", error);
                    }
                );
            });
            return resultado;
        },
        delete: function (codigo) {
            var query = "DELETE FROM componente WHERE lancamento_id = ?";
            var values = [codigo];
            db.transaction(function (tx) {
                tx.executeSql(query, values);
            });
        },
        getById: function (codigo) {
            var query = "SELECT * FROM componente WHERE lancamento_id = ?";
            var values = [codigo];
            var resultado = new Array();
            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                        var len = result.rows.length, i;
                        for (i = 0; i < len; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log('Deu errado!', error);
                    }
                );
            });

            return resultado;
        }
    }
});

sqlite.factory('fotoFactory', function (parcelaFactory) {
    return {
        insert: function (foto, observacao, comunicado_id) {
            var query = "INSERT INTO foto (foto, observacao, comunicado_id) VALUES (?, ?, ?)";
            var values = [foto, observacao, comunicado_id];
            var retorno = null;
            db.transaction(function (tx) {
                return tx.executeSql(query, values, function (tx, result) {
                    console.log(result.insertId)
                    retorno = result.insertId;
                }, function (tx, err) {
                    console.log("Error Foto",err);
                });
            });
            return retorno;
        },
        insertInsp: function (foto, observacao, codigo) {
            var query = "INSERT INTO foto (foto, observacao, inspecao_id) VALUES (?, ?, ?)";
            var values = [foto, observacao, codigo];
            var retorno = null;
            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                    console.log("Insert Photo", result.insertId)
                    retorno = result.insertId;
                }, function (tx, err) {
                    console.log("Error Foto",err);
                });
            });
            return retorno;
        },
        select: function () {
            var query = "SELECT * FROM foto";
            var resultado = [];
            db.transaction(function (tx) {
                tx.executeSql(query, [], function (tx, result) {
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log("Error Foto",err);
                    }
                );
            });
            return resultado;
        },
        delete: function (codigo) {
            var query = "DELETE FROM foto WHERE comunicado_id = ?";
            var values = [codigo];
            db.transaction(function (tx) {
                tx.executeSql(query, values);
            });
        },
        deleteInsp: function (codigo) {
            var query = "DELETE FROM foto WHERE inspecao_id = ?";
            var values = [codigo];
            db.transaction(function (tx) {
                tx.executeSql(query, values);
                // parcelaFactory.delete(codigo);
            });
        },
        getById: function (codigo) {
            var query = "SELECT * FROM foto WHERE comunicado_id = ?";
            var values = [codigo];
            var resultado = new Array();
            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                        var len = result.rows.length, i;
                        for (i = 0; i < len; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log("Error Foto",err);
                    }
                );
            });

            return resultado;
        },
        getInspById: function (codigo) {
            var query = "SELECT * FROM foto WHERE inspecao_id = ?";
            var values = [codigo];
            var resultado = new Array();

            db.transaction(function (tx) {
                tx.executeSql(query, values, function (tx, result) {
                        var len = result.rows.length, i;
                        for (i = 0; i < len; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log("Error Foto",err);
                    }
                );
            });

            return resultado;
        }
    }
});

sqlite.factory('crudFactory', function () {
    return {
        insert: {},
        select: function (table) {
            var query = "SELECT * FROM " + table;
            var resultado = [];
            db.transaction(function (tx) {
                tx.executeSql(query, [], function (tx, result) {
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log("Error:", error);
                    }
                );
            });
            return resultado;
        },
        delete: function (table, column, codigo) {
            var query = "DELETE FROM " + table + " WHERE " + table + "." + column + " = ?";
            var values = [codigo];
            db.transaction(function (tx) {
                tx.executeSql(query, values);
            });
        },
        update: function (table, columns, column, codigo) {
            var query = "UPDATE " + table + " SET " + columns + " WHERE " + table + "." + column + " = ?";
            var values = [codigo];
            db.transaction(function (tx) {
                tx.executeSql(query, values);
            });
        },
        getbyid: function (table, codigo) {
            var query = "SELECT * FROM " + table + " WHERE " + table + ".codigo = ?";
            var resultado = [codigo];
            db.transaction(function (tx) {
                tx.executeSql(query, [], function (tx, result) {
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            resultado.push(row);
                        }
                    },
                    function (tx, error) {
                        console.log("Error:", error);
                    }
                );
            });
            return resultado;
        }
    }
})