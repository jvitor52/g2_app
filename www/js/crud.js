function ultimo(DatabaseValues, tabela, where, params, resultado) {

    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function(transacao) {

        var sql = 'SELECT * FROM ' + tabela + ' WHERE ' + where + ' ORDER BY id DESC LIMIT 1';

        transacao.executeSql(sql, params, function(tx, result) {
            resultado(result.rows.item(0));
        });
    });
}



function listagem(DatabaseValues, tabela, referencia, id) {

    var resultado = [];

    DatabaseValues.setup();
    DatabaseValues.bancoDeDados.transaction(function(transacao) {

        var sql;
        var params = [];

        if (typeof referencia != 'undefined') {
            sql = 'SELECT * FROM ' + tabela + ' WHERE ' + referencia + ' = ? ORDER BY id DESC';
            params.push(id);
        } else {
            sql = 'SELECT * FROM ' + tabela + ' ORDER BY id DESC LIMIT 20';
        }

        transacao.executeSql(sql, params, function(tx, result) {
            for (var i = 0; i < result.rows.length; i++) {
                var row = result.rows.item(i);
                resultado.push(row);
            }
        });
    });


    return resultado;
}

function tratamento(valor) {
    return (typeof valor != 'undefined') ? valor : '';
}

function tratamentoData(data) {
    return data.toISOString().substring(0, 10);
}

function executaSQL(transacao, sql, params) {
    
    transacao.executeSql(sql, params, function (tx, result) {

      
    }, function (tx, error) {
        console.warn(error.message, sql);
    });
    
}