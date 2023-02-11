class Causa {
    id = null;
    descricao = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
    }
}

class CentroDeTrabalho {
    id = null;
    descricao = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
    }
}

class Checklist {

    OPERACAO = 1;
    MECANICO = 2;

    patrimonio = null;
    decs = null;
    delphID = null;
    tipo = null;

    constructor() {
        this.decs = [];
    }

}

class ChecklistMecanico {
    delphID = null;
    numero = null;
    atributo = null;
    patrimonio = null;
    operacao = null;
    operador = null;
    data = null;
    decs = null;
    mecanico = null;
    horimetro = null;

    constructor() {
        this.operador = new Operador();
        this.data = new Date();
        this.patrimonio = new Seletor();
        this.decs = [];
        this.mecanico = new Seletor();
    }
}

class ChecklistOperacao {
    delphID = null;
    numero = null;
    atributo = null;
    patrimonio = null;
    operacao = null;
    operador = null;
    data = null;
    decs = null;

    constructor() {
        this.operador = new Operador();
        this.data = new Date();
        this.patrimonio = new Seletor();
        this.decs = [];
    }
}

class ControleContaminacao {
    id = null;
    data = null;
    patrimonio = null;
    mecanico = null;
    medicao = null;
    medicaoIdeal = null
    dataAnterior = null;
    medicaoAnterior = null;

    constructor() {
        this.data = new Date();
        this.patrimonio = new Patrimonio();
        this.mecanico = new Mecanico();
    }
}

class DadosTecnicos {
    parteObjeto = null;
    textoPO = null;
    sintoma = null;
    causa = null;
    solucao = null;
    textoAtividade = null;
    dataHoraInicial = null;
    dataHoraFinal = null;
    totalHoras = null;

    constructor() {
        this.parteObjeto = new ParteObjeto();
        this.textoPO = '';
        this.sintoma = new Sintoma();
        this.causa = new Causa();
        this.solucao = new Solucao();
        this.textoAtividade = '';
        this.dataHoraInicial = new Date();
        this.dataHoraInicial.setSeconds(0);
        this.dataHoraInicial.setMilliseconds(0);
        this.dataHoraFinal = new Date();
        this.dataHoraFinal.setSeconds(0);
        this.dataHoraFinal.setMilliseconds(0);
        this.totalHoras = '';
    }

}

class Dec {
    nome = null;
    itens = null;

    constructor() {
        this.itens = [];
    }
}

class Extra {
    observacao = null;
    foto = null;
    data = null;
}

class HorasMecanico {
    id = null;
    mecanico = null;
    dataHoraInicial = null;
    dataHoraFinal = null;
    totalHoras = null;
    finalizado = null;
    dataDePrevisao = null;
    equipamentoLiberado = null;
    descricaoDoServiço = null;

    constructor() {
        this.mecanico = new Mecanico();
        this.dataHoraInicial = new Date();
        this.dataHoraInicial.setSeconds(0);
        this.dataHoraInicial.setMilliseconds(0);
        this.totalHoras = '';
        this.finalizado = '';
        this.dataDePrevisao = new Date();
        this.dataDePrevisao.setSeconds(0);
        this.dataDePrevisao.setMilliseconds(0);
        this.equipamentoLiberado = '';
        this.descricaoDoServiço = '';
    }

}

class Item {

    OPERACAO = 1;
    MANUTENCAO = 2;

    id = null;
    delphID = null;
    nome = null;
    conformidade = false;
    extra = null;
    tipoNota = null;
    tipo = null;

    constructor() {
        this.extra = new Extra();
        this.tipo = new TipoNota();
    }
}

class Input {
    mobileID = null;
    checklistOperacoes = [];
    checklistMecanico = [];
    controleContaminacoes = [];
}

class ListaDeTarefa {
    id = null;
    descricao = null;
    modelo = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
        this.modelo = new Modelo();

    }
}

class Material {
    id = null;
    codigo = null;
    descricao = null;
    unidade = null;
    quantidade = null;
    codfabricante = null;

    constructor() {
        this.id = 0;
        this.codigo = '';
        this.descricao = '';
        this.unidade = '';
        this.quantidade = '';
        this.codfabricante = '';
    }
}



class MaterialUtilizado {
    id = null;
    dataSaida = null;
    quantidade = null;
    material = null;

    constructor() {
        this.id = 0;
        this.dataSaida = new Date();
        this.dataSaida.setSeconds(0);
        this.dataSaida.setMilliseconds(0);
        this.quantidade = 0;
        this.material = new Material();
    }

}

class MaterialListaTarefa {
    modelo = null;
    listaTarefa = null;
    material = null;
    quantidadeIdeal = null;
    variacaoAceita = null;

    constructor() {
        this.modelo = 0;
        this.listaTarefa = 0;
        this.material = 0;
        this.quantidadeIdeal = 0;
        this.variacaoAceita = 0;
    }
}


class Mecanico {
    id = null;
    nome = null;

    constructor() {
        this.id = 0;
        this.nome = '';
    }
}

class Modelo {
    id = null;
    nome = null;

    constructor() {
        this.id = 0;
        this.nome = '';
    }
}

class Operacao {
    id = null;
    descricao = null;
    centroDeTrabalho = null;
    listaHorasMecanico = null;
    listaMateriaisUtilizados = null;
    listaDadosTecnicos = null;
    listaSolicitacaoMateriais = null;
    automatica = null;
    constructor() {
        this.id = 0;
        this.descricao = '';
        this.centroDeTrabalho = new CentroDeTrabalho();
        this.listaHorasMecanico = [];
        this.listaMateriaisUtilizados = [];
        this.listaSolicitacaoMateriais = [];
        this.listaDadosTecnicos = [];
        this.automatica = '';
    }
}

class Operador {
    id = null;
    delphID = null;
    matricula = null;
    nome = null;
}

class OrdemdeServico {

    numero = null;
    numeroSap = null;
    delphID = null;
    id = null;
    data = null;
    patrimonio = null;
    mecanico = null;
    tipoOrdem = null;
    descricao = null;
    descricaoDetalhada = null;
    tipoAtividade = null;
    dataInicioAvaria = null;
    dataFimAvaria = null;
    parada = null;
    duracaoTotal = null;
    operacoes = null;
    status = null;

    constructor() {
        this.id = 0;
        this.numero = '';
        this.numeroSap = '';
        this.patrimonio = new Patrimonio();
        this.tipoOrdem = new TipoOrdemServico();
        this.tipoAtividade = new TipoAtividade();
        this.mecanico = new Mecanico();
        this.data = new Date();
        this.data.setSeconds(0);
        this.data.setMilliseconds(0);
        this.dataInicioAvaria = new Date();
        this.dataInicioAvaria.setSeconds(0);
        this.dataInicioAvaria.setMilliseconds(0);
        this.dataFimAvaria = undefined;
        this.descricao = '';
        this.descricaoDetalhada = '';
        this.parada = false;
        this.duracaoTotal = ''
        this.operacoes = [];
        this.status = '';
    }
}

class Output {
    causa = [];
    centrodetrabalho = [];
    checklists = [];
    controleContaminacoes = [];
    listadetarefa = [];
    materiais = [];
    mecanicos = [];
    os = [];
    parteobjeto = [];
    patrimonio = [];
    sintoma = [];
    solucao = [];
    tipoPrioridade = [];
    tipoatividade = [];
    tipoordem = [];
}

class ParteObjeto {
    id = null;
    descricao = null;
    nome = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
        this.nome = '';
    }
}

class Patrimonio {
    id = null;
    nome = null;
    modelo = null;
    operacao = null;

    constructor() {
        this.modelo = new Seletor();
        this.operacao = new Seletor();
    }
}

class Periodicidade {
    id = null;
    nome = null;
    delphID = null;
    prazo = 0;
}

class Prioridade {
    id = null;
    nome = null;
    codigoSAP = null;

    constructor() {
        this.id = 0;
        this.nome = '';
        this.codigoSAP = '';
    }
}

class Seletor {
    id = null;
    nome = null;
    delphID = null;
}

class Servico {
    id = null;
    descricao = null;
    centroDeTrabalho = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
        this.centroDeTrabalho = new CentroDeTrabalho();
    }
}

class Sintoma {
    id = null;
    descricao = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
    }
}

class SolicitacaodeMaterial {
    material = null;
    materialId = null;
    dataDaSolicitacao = null;
    descricao = null;
    codFabricante = null;
    quantidade = null;
    solicitante = null;
    solicitanteId = null;
    prioridade = null;
    prioridadeId = null;
    ordemdeServicoId = null;
    operacaoId = null;
    patrimonio = null;
    foto = null;
    sync = null;

    constructor() {
        this.material = new Material();
        this.dataDaSolicitacao = new Date();
        this.dataDaSolicitacao.setSeconds(0);
        this.dataDaSolicitacao.setMilliseconds(0);
        this.descricao = '';
        this.solicitante = new Mecanico();
        this.prioridade = new Seletor();
        this.patrimonio = new Patrimonio();
        this.ordemdeServicoId = '';
        this.foto = '';
        this.sync = '';
    }
}

class SolicitacaoManutencao {
    numero = null;
    numeroChecklist = null;

    data = null;
    finalizado = null;
    tipo = null;
    tipoSolicitacao = null;
    patrimonio = null;
    descricaoFalha = null;
    detalhada = null;
    autor = null;
    dataAvaria = null;
    dataDesejada = null;
    prioridade = null;

    constructor() {
        this.data = new Date();
        this.data.setSeconds(0);
        this.data.setMilliseconds(0);
        this.patrimonio = new Patrimonio();
        this.autor = new Operador();
        this.dataAvaria = new Date();
        this.dataAvaria.setSeconds(0);
        this.dataAvaria.setMilliseconds(0);
        this.tipo = new TipoNota();
    }

}

class Solucao {
    id = null;
    descricao = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
    }
}

class Tarefa {
    id = null;
    descricao = null;
    horasMecanico = null;
    materiais = null;
    centroDeTrabalho = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
        this.horasMecanico = [];
        this.materiais = [];
        this.centroDeTrabalho = new CentroDeTrabalho();
    }
}

class TipoAtividade {
    id = null;
    descricao = null;


    constructor() {
        this.id = 0;
        this.descricao = '';
    }
}

class TipoNota {
    id = null;
    nome = null;

    delphID = null;
    prioridade = null;

    constructor() {
        this.prioridade = new Periodicidade();
    }
}

class TipoOrdemServico {
    id = null;
    codigoSap = null;
    descricao = null;
    tipo = null;

    constructor() {
        this.id = 0;
        this.descricao = '';
        this.codigoSap = '';
        this.tipo = new Seletor();
    }
}


class Fabricante {
    id = null;
    nome = null;

    constructor() {
        this.id = 0;
        this.nome = '';
    }
}