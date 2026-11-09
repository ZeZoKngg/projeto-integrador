
package br.com.launchcontrol;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// Define os tipos de usuários que podem acessar o sistema
// Cada perfil possui funcionalidades específicas no LaunchControl
enum Perfil {
    CLIENTE,
    OFICINA,
    FORNECEDOR,
    ADMINISTRADOR
}

// Representa as etapas de uma solicitação de serviço
// O status muda conforme o atendimento avança
enum StatusSolicitacao {
    AGUARDANDO,
    EM_ANALISE,
    AGUARDANDO_APROVACAO,
    APROVADO,
    RECUSADO,
    EM_EXECUCAO,
    CONCLUIDO
}

// Entidade responsável por armazenar os usuários cadastrados
// O e-mail deve ser único para evitar contas duplicadas
@Entity
@Table(name = "usuarios", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
class Usuario {

    // Identificador gerado automaticamente pelo banco
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Nome do usuário, obrigatório e limitado a 100 caracteres
    @Column(nullable = false, length = 100)
    String nome;

    // E-mail utilizado para identificar o usuário no login
    @Column(nullable = false, unique = true, length = 140)
    String email;

    // Armazena a senha codificada pelo sistema de autenticação
    @Column(nullable = false)
    String senha;

    // Salva o perfil como texto no banco de dados
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    Perfil perfil;

    // Telefone opcional para contato
    @Column(length = 20)
    String telefone;

    // Construtor necessário para o JPA
    protected Usuario() {}

    // Construtor utilizado no cadastro de novos usuários
    Usuario(String n, String e, String s, Perfil p) {
        nome = n;
        email = e;
        senha = s;
        perfil = p;
    }
}

// Armazena os veículos cadastrados pelos clientes
@Entity
@Table(name = "veiculos", uniqueConstraints = @UniqueConstraint(columnNames = {"placa"}))
class Veiculo {

    // Código único de cada veículo
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Um cliente pode possuir vários veículos cadastrados
    // O carregamento LAZY evita buscar o cliente antes de ser necessário
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    Usuario cliente;

    // Modelo ou identificação do veículo
    @Column(nullable = false, length = 80)
    String modelo;

    // Ano de fabricação informado no cadastro
    @Column(nullable = false)
    Integer ano;

    // Placa única para impedir o cadastro duplicado do veículo
    @Column(nullable = false, length = 7)
    String placa;

    // Quilometragem atual do veículo
    Integer quilometragem;

    // Construtor utilizado pelo JPA
    protected Veiculo() {}

    // Recebe as informações necessárias para cadastrar um veículo
    Veiculo(Usuario c, String m, Integer a, String p, Integer km) {
        cliente = c;
        modelo = m;
        ano = a;
        placa = p;
        quilometragem = km;
    }
}

// Registra os serviços solicitados pelos clientes
// Relaciona o cliente, o veículo e a oficina responsável
@Entity
@Table(name = "solicitacoes")
class Solicitacao {

    // Identificador da solicitação
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Cliente responsável por solicitar o serviço
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    Usuario cliente;

    // Veículo que receberá o atendimento
    @ManyToOne(optional = false)
    @JoinColumn(name = "veiculo_id")
    Veiculo veiculo;

    // Oficina que ficará responsável pela solicitação
    // O relacionamento permite que a oficina seja definida posteriormente
    @ManyToOne
    @JoinColumn(name = "oficina_id")
    Usuario oficina;

    // Nome do serviço solicitado
    @Column(nullable = false, length = 100)
    String servico;

    // Descrição do problema relatado pelo cliente
    @Column(nullable = false, length = 1500)
    String descricao;

    // Toda nova solicitação começa aguardando atendimento
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    StatusSolicitacao status = StatusSolicitacao.AGUARDANDO;

    // Laudo técnico informado pela oficina
    @Column(length = 4000)
    String laudo;

    // Registra quando a solicitação foi criada e atualizada
    LocalDateTime criadaEm = LocalDateTime.now(),
                  atualizadaEm = LocalDateTime.now();

    // Construtor exigido pelo JPA
    protected Solicitacao() {}

    // Cria uma solicitação vinculada ao cliente e ao veículo
    Solicitacao(Usuario c, Veiculo v, String s, String d) {
        cliente = c;
        veiculo = v;
        servico = s;
        descricao = d;
    }
}

// Armazena os orçamentos preparados pelas oficinas
@Entity
@Table(name = "orcamentos")
class Orcamento {

    // Identificador do orçamento
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Cada solicitação possui no máximo um orçamento associado
    @OneToOne(optional = false)
    @JoinColumn(name = "solicitacao_id", unique = true)
    Solicitacao solicitacao;

    // Valor das peças necessárias para realizar o serviço
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal pecas = BigDecimal.ZERO;

    // Valor cobrado pela mão de obra da oficina
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal maoDeObra = BigDecimal.ZERO;

    // Desconto aplicado ao orçamento
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal desconto = BigDecimal.ZERO;

    // Outros valores que podem ser incluídos no serviço
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal adicionais = BigDecimal.ZERO;

    // Valor final do orçamento
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal total = BigDecimal.ZERO;

    // Quantidade estimada de dias para concluir o serviço
    Integer prazoDias;

    // Informações adicionais fornecidas pela oficina
    @Column(length = 1000)
    String observacoes;

    // Data de criação do orçamento
    LocalDateTime criadoEm = LocalDateTime.now();

    // Data da última atualização do orçamento
    LocalDateTime atualizadoEm = LocalDateTime.now();

    // Construtor utilizado pelo JPA
    protected Orcamento() {}
}

// Guarda as notificações enviadas aos usuários
@Entity
@Table(name = "notificacoes")
class Notificacao {

    // Identificador da notificação
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Usuário que receberá a notificação
    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    Usuario usuario;

    // Título apresentado na notificação
    @Column(nullable = false, length = 120)
    String titulo;

    // Conteúdo da mensagem enviada ao usuário
    @Column(nullable = false, length = 600)
    String mensagem;

    // Indica se a notificação já foi visualizada
    boolean lida = false;

    // Data e horário de criação
    LocalDateTime criadaEm = LocalDateTime.now();

    protected Notificacao() {}

    // Cria uma notificação para determinado usuário
    Notificacao(Usuario u, String t, String m) {
        usuario = u;
        titulo = t;
        mensagem = m;
    }
}

// Registra as avaliações feitas pelos clientes
// Cada solicitação pode receber apenas uma avaliação
@Entity
@Table(name = "avaliacoes", uniqueConstraints = @UniqueConstraint(columnNames = "solicitacao_id"))
class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Serviço que está sendo avaliado
    @OneToOne(optional = false)
    @JoinColumn(name = "solicitacao_id", unique = true)
    Solicitacao solicitacao;

    // Cliente responsável pela avaliação
    @ManyToOne(optional = false)
    Usuario cliente;

    // Oficina que realizou o atendimento
    @ManyToOne(optional = false)
    Usuario oficina;

    // Nota atribuída ao serviço
    @Column(nullable = false)
    Integer nota;

    // Comentário opcional sobre o atendimento
    @Column(length = 600)
    String comentario;

    // Data em que a avaliação foi registrada
    LocalDateTime criadaEm = LocalDateTime.now();

    protected Avaliacao() {}

    // Obtém o cliente e a oficina diretamente da solicitação
    Avaliacao(Solicitacao s, Integer n, String c) {
        solicitacao = s;
        cliente = s.cliente;
        oficina = s.oficina;
        nota = n;
        comentario = c;
    }
}

// Representa as peças cadastradas pelos fornecedores
@Entity
@Table(name = "pecas", uniqueConstraints = @UniqueConstraint(columnNames = {"codigo", "fornecedor_id"}))
class Peca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Fornecedor responsável pelo cadastro da peça
    @ManyToOne(optional = false)
    @JoinColumn(name = "fornecedor_id")
    Usuario fornecedor;

    // Código de identificação da peça
    // O mesmo fornecedor não pode repetir esse código
    @Column(nullable = false, length = 40)
    String codigo;

    // Nome utilizado para identificar a peça
    @Column(nullable = false, length = 120)
    String nome;

    // Preço unitário da peça
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal preco;

    // Quantidade disponível em estoque
    @Column(nullable = false)
    Integer quantidade;

    protected Peca() {}

    // Construtor utilizado para cadastrar uma peça no estoque
    Peca(Usuario f, String c, String n, BigDecimal p, Integer q) {
        fornecedor = f;
        codigo = c;
        nome = n;
        preco = p;
        quantidade = q;
    }
}

// Controla as cobranças relacionadas aos serviços aprovados
@Entity
@Table(name = "cobrancas", uniqueConstraints = @UniqueConstraint(columnNames = "solicitacao_id"))
class Cobranca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Cada solicitação possui no máximo uma cobrança
    @OneToOne(optional = false)
    @JoinColumn(name = "solicitacao_id", unique = true)
    Solicitacao solicitacao;

    // Valor que deverá ser pago pelo serviço
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal valor;

    // Toda cobrança começa com o status PENDENTE
    @Column(nullable = false, length = 30)
    String status = "PENDENTE";

    // Descrição utilizada para identificar a cobrança
    @Column(length = 500)
    String descricao;

    // Data em que a cobrança foi criada
    LocalDateTime criadaEm = LocalDateTime.now();

    protected Cobranca() {}

    // Cria uma cobrança com base no serviço solicitado
    Cobranca(Solicitacao s, BigDecimal v) {
        solicitacao = s;
        valor = v;
        descricao = "Serviço: " + s.servico;
    }
}

// Mantém o histórico das propostas de orçamento
// Permite consultar os valores registrados anteriormente
@Entity
@Table(name = "historico_orcamentos")
class HistoricoOrcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Orçamento ao qual o registro pertence
    @ManyToOne(optional = false)
    Orcamento orcamento;

    // Valor total registrado naquele momento
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal total;

    // Descrição da alteração realizada no orçamento
    @Column(nullable = false, length = 200)
    String descricao;

    // Data e horário do registro
    LocalDateTime registradoEm = LocalDateTime.now();

    protected HistoricoOrcamento() {}

    // Guarda o valor atual do orçamento no histórico
    HistoricoOrcamento(Orcamento o, String d) {
        orcamento = o;
        total = o.total;
        descricao = d;
    }
}

// Armazena as mensagens trocadas durante os atendimentos
@Entity
@Table(name = "mensagens_atendimento")
class MensagemAtendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Solicitação à qual a conversa pertence
    @ManyToOne(optional = false)
    @JoinColumn(name = "solicitacao_id")
    Solicitacao solicitacao;

    // Usuário responsável pelo envio da mensagem
    @ManyToOne(optional = false)
    @JoinColumn(name = "remetente_id")
    Usuario remetente;

    // Texto enviado pelo cliente ou pela oficina
    @Column(nullable = false, length = 2000)
    String texto;

    // Registra a data e o horário do envio
    @Column(nullable = false)
    LocalDateTime enviadaEm = LocalDateTime.now();

    protected MensagemAtendimento() {}

    // Cria uma mensagem vinculada à solicitação e ao remetente
    MensagemAtendimento(Solicitacao s, Usuario u, String t) {
        solicitacao = s;
        remetente = u;
        texto = t;
    }
}

// Guarda os arquivos enviados durante um atendimento
// Pode armazenar imagens e vídeos relacionados ao serviço
@Entity
@Table(name = "anexos_atendimento")
class AnexoAtendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Solicitação que recebeu o arquivo
    @ManyToOne(optional = false)
    @JoinColumn(name = "solicitacao_id")
    Solicitacao solicitacao;

    // Usuário responsável pelo envio
    @ManyToOne(optional = false)
    @JoinColumn(name = "autor_id")
    Usuario autor;

    // Nome original ou tratado do arquivo
    @Column(nullable = false, length = 150)
    String nome;

    // Tipo do arquivo, como image/png ou video/mp4
    @Column(nullable = false, length = 50)
    String tipo;

    // Armazena o conteúdo binário do arquivo no banco
    // LONGBLOB permite guardar dados binários de maior tamanho
    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    byte[] conteudo;

    // Data em que o anexo foi cadastrado
    LocalDateTime criadoEm = LocalDateTime.now();

    protected AnexoAtendimento() {}

    // Construtor utilizado ao salvar um novo anexo
    AnexoAtendimento(Solicitacao s, Usuario a, String n, String t, byte[] b) {
        solicitacao = s;
        autor = a;
        nome = n;
        tipo = t;
        conteudo = b;
    }
}

// Registra as atualizações realizadas pela oficina
// Permite que o cliente acompanhe a manutenção do veículo
@Entity
@Table(name = "diario_manutencao")
class DiarioManutencao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Atendimento ao qual a atualização pertence
    @ManyToOne(optional = false)
    @JoinColumn(name = "solicitacao_id")
    Solicitacao solicitacao;

    // Oficina responsável pelo registro no diário
    @ManyToOne(optional = false)
    @JoinColumn(name = "oficina_id")
    Usuario oficina;

    // Descrição do andamento da manutenção
    @Column(nullable = false, length = 1500)
    String observacao;

    // Data e horário em que a atualização foi registrada
    LocalDateTime criadoEm = LocalDateTime.now();

    protected DiarioManutencao() {}

    // Cria uma atualização vinculada à oficina e à solicitação
    DiarioManutencao(Solicitacao s, Usuario o, String texto) {
        solicitacao = s;
        oficina = o;
        observacao = texto;
    }
}

// Guarda os tokens utilizados no processo de recuperação de senha
// Cada token fica associado a um usuário e possui prazo de validade
@Entity
@Table(name = "tokens_recuperacao")
class TokenRecuperacaoSenha {

    // Identificador do registro de recuperação
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Usuário que solicitou a recuperação de senha
    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    Usuario usuario;

    // Armazena o hash do token, e não o token original
    // O valor deve ser único para cada registro
    @Column(nullable = false, unique = true, length = 64)
    String tokenHash;

    // Define até quando o token poderá ser utilizado
    @Column(nullable = false)
    LocalDateTime expiraEm;

    // Indica se o token já foi utilizado
    // Começa como false para permitir a recuperação
    @Column(nullable = false)
    boolean utilizado = false;

    // Construtor necessário para o JPA
    protected TokenRecuperacaoSenha() {}

    // Cria um registro com o usuário, o hash e a validade do token
    TokenRecuperacaoSenha(
        Usuario usuario,
        String tokenHash,
        LocalDateTime expiraEm
    ) {
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.expiraEm = expiraEm;
    }
}
