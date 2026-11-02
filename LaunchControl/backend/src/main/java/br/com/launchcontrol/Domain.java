package br.com.launchcontrol;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

enum Perfil { CLIENTE, OFICINA, FORNECEDOR, ADMINISTRADOR }
enum StatusSolicitacao { AGUARDANDO, EM_ANALISE, AGUARDANDO_APROVACAO, APROVADO, RECUSADO, EM_EXECUCAO, CONCLUIDO }

@Entity @Table(name="usuarios", uniqueConstraints=@UniqueConstraint(columnNames="email"))
class Usuario {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @Column(nullable=false,length=100) String nome;
 @Column(nullable=false,unique=true,length=140) String email;
 @Column(nullable=false) String senha;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) Perfil perfil;
 @Column(length=20) String telefone;
 protected Usuario(){}
 Usuario(String n,String e,String s,Perfil p){nome=n;email=e;senha=s;perfil=p;}
}
@Entity @Table(name="veiculos", uniqueConstraints=@UniqueConstraint(columnNames={"placa"}))
class Veiculo {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="cliente_id") Usuario cliente;
 @Column(nullable=false,length=80) String modelo;
 @Column(nullable=false) Integer ano;
 @Column(nullable=false,length=7) String placa;
 Integer quilometragem;
 protected Veiculo(){}
 Veiculo(Usuario c,String m,Integer a,String p,Integer km){cliente=c;modelo=m;ano=a;placa=p;quilometragem=km;}
}
@Entity @Table(name="solicitacoes")
class Solicitacao {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false) @JoinColumn(name="cliente_id") Usuario cliente;
 @ManyToOne(optional=false) @JoinColumn(name="veiculo_id") Veiculo veiculo;
 @ManyToOne @JoinColumn(name="oficina_id") Usuario oficina;
 @Column(nullable=false,length=100) String servico;
 @Column(nullable=false,length=1500) String descricao;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) StatusSolicitacao status=StatusSolicitacao.AGUARDANDO;
 @Column(length=4000) String laudo;
 LocalDateTime criadaEm=LocalDateTime.now(), atualizadaEm=LocalDateTime.now();
 protected Solicitacao(){}
 Solicitacao(Usuario c,Veiculo v,String s,String d){cliente=c;veiculo=v;servico=s;descricao=d;}
}
@Entity @Table(name="orcamentos")
class Orcamento {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @OneToOne(optional=false) @JoinColumn(name="solicitacao_id",unique=true) Solicitacao solicitacao;
 @Column(nullable=false,precision=12,scale=2) BigDecimal pecas=BigDecimal.ZERO;
 @Column(nullable=false,precision=12,scale=2) BigDecimal maoDeObra=BigDecimal.ZERO;
 @Column(nullable=false,precision=12,scale=2) BigDecimal desconto=BigDecimal.ZERO;
 @Column(nullable=false,precision=12,scale=2) BigDecimal adicionais=BigDecimal.ZERO;
 @Column(nullable=false,precision=12,scale=2) BigDecimal total=BigDecimal.ZERO;
 Integer prazoDias;
 @Column(length=1000) String observacoes;
 LocalDateTime criadoEm=LocalDateTime.now();
 LocalDateTime atualizadoEm=LocalDateTime.now();
 protected Orcamento(){}
}
@Entity @Table(name="notificacoes")
class Notificacao {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false) @JoinColumn(name="usuario_id") Usuario usuario;
 @Column(nullable=false,length=120) String titulo;
 @Column(nullable=false,length=600) String mensagem;
 boolean lida=false;
 LocalDateTime criadaEm=LocalDateTime.now();
 protected Notificacao(){}
 Notificacao(Usuario u,String t,String m){usuario=u;titulo=t;mensagem=m;}
}
@Entity @Table(name="avaliacoes",uniqueConstraints=@UniqueConstraint(columnNames="solicitacao_id"))
class Avaliacao {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @OneToOne(optional=false) @JoinColumn(name="solicitacao_id",unique=true) Solicitacao solicitacao;
 @ManyToOne(optional=false) Usuario cliente;
 @ManyToOne(optional=false) Usuario oficina;
 @Column(nullable=false) Integer nota;
 @Column(length=600) String comentario;
 LocalDateTime criadaEm=LocalDateTime.now();
 protected Avaliacao(){}
 Avaliacao(Solicitacao s,Integer n,String c){solicitacao=s;cliente=s.cliente;oficina=s.oficina;nota=n;comentario=c;}
}

@Entity @Table(name="pecas", uniqueConstraints=@UniqueConstraint(columnNames={"codigo","fornecedor_id"}))
class Peca {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false) @JoinColumn(name="fornecedor_id") Usuario fornecedor;
 @Column(nullable=false,length=40) String codigo;
 @Column(nullable=false,length=120) String nome;
 @Column(nullable=false,precision=12,scale=2) BigDecimal preco;
 @Column(nullable=false) Integer quantidade;
 protected Peca(){}
 Peca(Usuario f,String c,String n,BigDecimal p,Integer q){fornecedor=f;codigo=c;nome=n;preco=p;quantidade=q;}
}

@Entity @Table(name="cobrancas",uniqueConstraints=@UniqueConstraint(columnNames="solicitacao_id"))
class Cobranca {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @OneToOne(optional=false) @JoinColumn(name="solicitacao_id",unique=true) Solicitacao solicitacao;
 @Column(nullable=false,precision=12,scale=2) BigDecimal valor;
 @Column(nullable=false,length=30) String status="PENDENTE";
 @Column(length=500) String descricao;
 LocalDateTime criadaEm=LocalDateTime.now();
 protected Cobranca(){}
 Cobranca(Solicitacao s,BigDecimal v){solicitacao=s;valor=v;descricao="Serviço: "+s.servico;}
}
@Entity @Table(name="historico_orcamentos")
class HistoricoOrcamento {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false) Orcamento orcamento;
 @Column(nullable=false,precision=12,scale=2) BigDecimal total;
 @Column(nullable=false,length=200) String descricao;
 LocalDateTime registradoEm=LocalDateTime.now();
 protected HistoricoOrcamento(){}
 HistoricoOrcamento(Orcamento o,String d){orcamento=o;total=o.total;descricao=d;}
}

@Entity @Table(name="mensagens_atendimento")
class MensagemAtendimento {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false) @JoinColumn(name="solicitacao_id") Solicitacao solicitacao;
 @ManyToOne(optional=false) @JoinColumn(name="remetente_id") Usuario remetente;
 @Column(nullable=false,length=2000) String texto;
 @Column(nullable=false) LocalDateTime enviadaEm=LocalDateTime.now();
 protected MensagemAtendimento(){}
 MensagemAtendimento(Solicitacao s,Usuario u,String t){solicitacao=s;remetente=u;texto=t;}
}


@Entity @Table(name="anexos_atendimento")
class AnexoAtendimento {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false) @JoinColumn(name="solicitacao_id") Solicitacao solicitacao;
 @ManyToOne(optional=false) @JoinColumn(name="autor_id") Usuario autor;
 @Column(nullable=false,length=150) String nome;
 @Column(nullable=false,length=50) String tipo;
 @Lob @Column(nullable=false,columnDefinition="LONGBLOB") byte[] conteudo;
 LocalDateTime criadoEm=LocalDateTime.now();
 protected AnexoAtendimento(){}
 AnexoAtendimento(Solicitacao s,Usuario a,String n,String t,byte[] b){solicitacao=s;autor=a;nome=n;tipo=t;conteudo=b;}
}
@Entity @Table(name="diario_manutencao")
class DiarioManutencao {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false) @JoinColumn(name="solicitacao_id") Solicitacao solicitacao;
 @ManyToOne(optional=false) @JoinColumn(name="oficina_id") Usuario oficina;
 @Column(nullable=false,length=1500) String observacao;
 LocalDateTime criadoEm=LocalDateTime.now();
 protected DiarioManutencao(){}
 DiarioManutencao(Solicitacao s,Usuario o,String texto){solicitacao=s;oficina=o;observacao=texto;}
}


@Entity
@Table(name = "tokens_recuperacao")
class TokenRecuperacaoSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    Usuario usuario;

    @Column(nullable = false, unique = true, length = 64)
    String tokenHash;

    @Column(nullable = false)
    LocalDateTime expiraEm;

    @Column(nullable = false)
    boolean utilizado = false;

    protected TokenRecuperacaoSenha() {}

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
