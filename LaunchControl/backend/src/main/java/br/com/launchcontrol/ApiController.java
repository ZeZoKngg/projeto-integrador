
package br.com.launchcontrol;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
class ApiController {

    private final AnexoAtendimentoRepo anexos;
    private final DiarioManutencaoRepo diario;
    private final MensagemAtendimentoRepo mensagens;
    private final UsuarioRepo usuarios;
    private final VeiculoRepo veiculos;
    private final SolicitacaoRepo solicitacoes;
    private final OrcamentoRepo orcamentos;
    private final NotificacaoRepo notificacoes;
    private final AvaliacaoRepo avaliacoes;
    private final PecaRepo pecas;
    private final PasswordEncoder encoder;
    private final CobrancaRepo cobrancas;
    private final HistoricoOrcamentoRepo historico;
    private final RecuperacaoSenhaService recuperacaoSenhaService;

    ApiController(
        UsuarioRepo u,
        VeiculoRepo v,
        SolicitacaoRepo s,
        OrcamentoRepo o,
        NotificacaoRepo n,
        AvaliacaoRepo a,
        PecaRepo p,
        PasswordEncoder e,
        CobrancaRepo c,
        HistoricoOrcamentoRepo h,
        MensagemAtendimentoRepo m,
        AnexoAtendimentoRepo an,
        DiarioManutencaoRepo di,
        RecuperacaoSenhaService recuperacaoSenhaService
    ) {
        anexos = an;
        diario = di;
        mensagens = m;
        usuarios = u;
        veiculos = v;
        solicitacoes = s;
        orcamentos = o;
        notificacoes = n;
        avaliacoes = a;
        pecas = p;
        encoder = e;
        cobrancas = c;
        historico = h;
        this.recuperacaoSenhaService = recuperacaoSenhaService;
    }

    record Cadastro(
        @NotBlank String nome,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6) String senha,
        @NotNull Perfil perfil,
        String telefone
    ) {}

    record VeiculoIn(
        @NotBlank String modelo,
        @NotNull @Min(1950) @Max(2100) Integer ano,
        @NotBlank String placa,
        @Min(0) Integer quilometragem
    ) {}

    record SolicitacaoIn(
        Long oficinaId,
        @NotNull Long veiculoId,
        @NotBlank String servico,
        @NotBlank @Size(max = 1500) String descricao
    ) {}

    record OrcamentoIn(
        @NotNull @DecimalMin("0") BigDecimal pecas,
        @NotNull @DecimalMin("0") BigDecimal maoDeObra,
        @NotNull @DecimalMin("0") BigDecimal desconto,
        @NotNull @DecimalMin("0") BigDecimal adicionais,
        @NotNull @Min(1) Integer prazoDias,
        String observacoes
    ) {}

    record DecisaoIn(@NotNull Boolean aprovado) {}

    record StatusIn(
        @NotNull StatusSolicitacao status,
        String laudo
    ) {}

    record AvaliacaoIn(
        @NotNull @Min(1) @Max(5) Integer nota,
        String comentario
    ) {}

    record AtualizarVeiculoIn(
        @NotBlank String modelo,
        @NotNull @Min(1950) @Max(2100) Integer ano,
        @Min(0) Integer quilometragem
    ) {}

    record PecaEstoqueIn(
        @NotNull @DecimalMin("0.01") BigDecimal preco,
        @NotNull @Min(0) Integer quantidade
    ) {}

    record CobrancaIn(@NotBlank String status) {}

    record PecaIn(
        @NotBlank String codigo,
        @NotBlank String nome,
        @NotNull @DecimalMin("0.01") BigDecimal preco,
        @NotNull @Min(0) Integer quantidade
    ) {}

    record MensagemIn(
        @NotBlank @Size(max = 2000) String texto
    ) {}

    record AnexoIn(
        @NotBlank String nome,
        @NotBlank String tipo,
        @NotBlank String base64
    ) {}

    record DiarioIn(
        @NotBlank @Size(max = 1500) String observacao
    ) {}

    record RecuperarSenhaIn(
        @NotBlank @Email String email
    ) {}

    record RedefinirSenhaIn(
        @NotBlank String token,
        @NotBlank String novaSenha
    ) {}

    private Usuario atual(Authentication a) {
        return usuarios.findByEmail(a.getName())
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED)
            );
    }

    private void perfil(Usuario u, Perfil p) {
        if (u.perfil != p && u.perfil != Perfil.ADMINISTRADOR) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Perfil sem permissão."
            );
        }
    }

    private Solicitacao solicitacao(Long id) {
        return solicitacoes.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Solicitação não encontrada."
                )
            );
    }

    private void notificar(Usuario u, String t, String m) {
        notificacoes.save(new Notificacao(u, t, m));
    }

    @GetMapping("/me")
    Map<String, Object> me(Authentication a) {
        Usuario u = atual(a);
        return Map.of(
            "id", u.id,
            "nome", u.nome,
            "email", u.email,
            "perfil", u.perfil
        );
    }

    @PostMapping("/public/cadastro")
    ResponseEntity<?> cadastro(
        @Valid @RequestBody Cadastro in
    ) {
        if (in.perfil() == Perfil.ADMINISTRADOR) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Cadastro de administrador indisponível."
            );
        }

        String email = in.email().trim().toLowerCase(Locale.ROOT);

        if (usuarios.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "E-mail já cadastrado."
            );
        }

        Usuario u = new Usuario(
            in.nome().trim(),
            email,
            encoder.encode(in.senha()),
            in.perfil()
        );

        u.telefone = in.telefone();
        usuarios.save(u);

        return ResponseEntity.status(201).body(
            Map.of(
                "mensagem",
                "Conta criada. Entre com e-mail e senha."
            )
        );
    }

    @PostMapping("/public/recuperar-senha")
    Map<String, String> recuperarSenha(
        @Valid @RequestBody RecuperarSenhaIn in
    ) {
        recuperacaoSenhaService.solicitar(in.email());

        return Map.of(
            "mensagem",
            "Se o e-mail estiver cadastrado, você receberá um link."
        );
    }

    @PostMapping("/public/redefinir-senha")
    Map<String, String> redefinirSenha(
        @Valid @RequestBody RedefinirSenhaIn in
    ) {
        recuperacaoSenhaService.redefinir(
            in.token(),
            in.novaSenha()
        );

        return Map.of(
            "mensagem",
            "Senha redefinida com sucesso."
        );
    }

    @GetMapping("/public/status")
    Map<String, String> status() {
        return Map.of(
            "sistema", "LaunchControl API",
            "status", "online"
        );
    }

    @GetMapping("/veiculos")
    List<Map<String, Object>> meusVeiculos(Authentication a) {
        Usuario u = atual(a);
        perfil(u, Perfil.CLIENTE);

        return veiculos.findByClienteId(u.id)
            .stream()
            .map(v -> Map.<String, Object>of(
                "id", v.id,
                "modelo", v.modelo,
                "ano", v.ano,
                "placa", v.placa,
                "quilometragem",
                v.quilometragem == null ? 0 : v.quilometragem
            ))
            .toList();
    }

    @PostMapping("/veiculos")
    @Transactional
    ResponseEntity<?> criarVeiculo(
        @Valid @RequestBody VeiculoIn in,
        Authentication a
    ) {
        Usuario u = atual(a);
        perfil(u, Perfil.CLIENTE);

        String placa = in.placa()
            .toUpperCase()
            .replaceAll("[^A-Z0-9]", "");

        if (!placa.matches("[A-Z]{3}[0-9][A-Z0-9][0-9]{2}")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Placa inválida (padrão Mercosul)."
            );
        }

        if (veiculos.existsByPlaca(placa)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Placa já cadastrada."
            );
        }

        Veiculo v = veiculos.save(
            new Veiculo(
                u,
                in.modelo().trim(),
                in.ano(),
                placa,
                in.quilometragem()
            )
        );

        return ResponseEntity.status(201).body(
            Map.of("id", v.id, "placa", v.placa)
        );
    }

    @PutMapping("/veiculos/{id}")
    @Transactional
    Map<String, Object> editarVeiculo(
        @PathVariable Long id,
        @Valid @RequestBody AtualizarVeiculoIn in,
        Authentication a
    ) {
        Usuario u = atual(a);
        perfil(u, Perfil.CLIENTE);

        Veiculo v = veiculos.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND)
            );

        if (!v.cliente.id.equals(u.id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        v.modelo = in.modelo().trim();
        v.ano = in.ano();
        v.quilometragem = in.quilometragem();
        veiculos.save(v);

        return Map.of(
            "id", v.id,
            "modelo", v.modelo,
            "ano", v.ano,
            "placa", v.placa,
            "quilometragem",
            v.quilometragem == null ? 0 : v.quilometragem
        );
    }

    @DeleteMapping("/veiculos/{id}")
    @Transactional
    void excluirVeiculo(
        @PathVariable Long id,
        Authentication a
    ) {
        Usuario u = atual(a);
        perfil(u, Perfil.CLIENTE);

        Veiculo v = veiculos.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND)
            );

        if (!v.cliente.id.equals(u.id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (solicitacoes.findAll().stream()
            .anyMatch(s -> s.veiculo.id.equals(id))) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Veículo possui histórico; não pode ser excluído."
            );
        }

        veiculos.delete(v);
    }

    @GetMapping("/oficinas")
    List<Map<String, Object>> oficinas(Authentication a) {
        atual(a);

        return usuarios.findAll()
            .stream()
            .filter(u -> u.perfil == Perfil.OFICINA)
            .map(u -> Map.<String, Object>of(
                "id", u.id,
                "nome", u.nome,
                "email", u.email
            ))
            .toList();
    }

    @GetMapping("/solicitacoes")
    List<Map<String, Object>> listar(Authentication a) {
        Usuario u = atual(a);

        List<Solicitacao> lista =
            u.perfil == Perfil.CLIENTE
                ? solicitacoes.findByClienteIdOrderByCriadaEmDesc(u.id)
                : u.perfil == Perfil.OFICINA
                    ? solicitacoes.findByOficinaIdOrderByCriadaEmDesc(u.id)
                    : solicitacoes.findAll();

        return lista.stream().map(this::dto).toList();
    }

    @PostMapping("/solicitacoes")
    @Transactional
    ResponseEntity<?> criarSolicitacao(
        @Valid @RequestBody SolicitacaoIn in,
        Authentication a
    ) {
        Usuario c = atual(a);
        perfil(c, Perfil.CLIENTE);

        Veiculo v = veiculos.findById(in.veiculoId())
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Veículo não encontrado."
                )
            );

        if (!v.cliente.id.equals(c.id)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Veículo não pertence ao cliente."
            );
        }

        Usuario oficina;

        if (in.oficinaId() == null) {
            oficina = usuarios.findAll()
                .stream()
                .filter(x -> x.perfil == Perfil.OFICINA)
                .findFirst()
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Nenhuma oficina cadastrada."
                    )
                );
        } else {
            oficina = usuarios.findById(in.oficinaId())
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Oficina não encontrada"
                    )
                );
        }

        if (oficina.perfil != Perfil.OFICINA) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Destino não é oficina"
            );
        }

        Solicitacao s = solicitacoes.save(
            new Solicitacao(
                c,
                v,
                in.servico().trim(),
                in.descricao().trim()
            )
        );

        s.oficina = oficina;
        solicitacoes.save(s);

        notificar(
            oficina,
            "Nova solicitação",
            c.nome + " solicitou " + s.servico
                + " para " + v.modelo + "."
        );

        return ResponseEntity.status(201).body(dto(s));
    }

    @GetMapping("/solicitacoes/{id}")
    Map<String, Object> detalhe(
        @PathVariable Long id,
        Authentication a
    ) {
        Usuario u = atual(a);
        Solicitacao s = solicitacao(id);
        autorizar(s, u);
        return dto(s);
    }

    private void autorizar(Solicitacao s, Usuario u) {
        if (
            u.perfil != Perfil.ADMINISTRADOR
            && !s.cliente.id.equals(u.id)
            && (
                s.oficina == null
                || !s.oficina.id.equals(u.id)
            )
        ) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    @PostMapping("/solicitacoes/{id}/orcamento")
    @Transactional
    Map<String, Object> orcar(
        @PathVariable Long id,
        @Valid @RequestBody OrcamentoIn in,
        Authentication a
    ) {
        Usuario o = atual(a);
        perfil(o, Perfil.OFICINA);

        Solicitacao s = solicitacao(id);

        if (
            s.oficina != null
            && !s.oficina.id.equals(o.id)
        ) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (
            s.status == StatusSolicitacao.CONCLUIDO
            || s.status == StatusSolicitacao.RECUSADO
            || s.status == StatusSolicitacao.APROVADO
            || s.status == StatusSolicitacao.EM_EXECUCAO
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Solicitação encerrada."
            );
        }

        BigDecimal total = in.pecas()
            .add(in.maoDeObra())
            .subtract(in.desconto())
            .add(in.adicionais());

        if (total.signum() < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Desconto maior que o subtotal."
            );
        }

        Orcamento q = orcamentos.findBySolicitacaoId(id)
            .orElseGet(Orcamento::new);

        q.solicitacao = s;
        q.pecas = in.pecas();
        q.maoDeObra = in.maoDeObra();
        q.desconto = in.desconto();
        q.adicionais = in.adicionais();
        q.total = total;
        q.prazoDias = in.prazoDias();
        q.observacoes = in.observacoes();
        q.atualizadoEm = LocalDateTime.now();

        orcamentos.save(q);

        historico.save(
            new HistoricoOrcamento(
                q,
                "Proposta enviada/atualizada pela oficina"
            )
        );

        s.status = StatusSolicitacao.AGUARDANDO_APROVACAO;
        s.atualizadaEm = LocalDateTime.now();
        solicitacoes.save(s);

        notificar(
            s.cliente,
            "Novo orçamento recebido",
            "Proposta de " + s.servico + ": R$ " + total + "."
        );

        return dto(s);
    }

    @PostMapping("/solicitacoes/{id}/decisao")
    @Transactional
    Map<String, Object> decidir(
        @PathVariable Long id,
        @Valid @RequestBody DecisaoIn in,
        Authentication a
    ) {
        Usuario c = atual(a);
        perfil(c, Perfil.CLIENTE);

        Solicitacao s = solicitacao(id);

        if (!s.cliente.id.equals(c.id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (s.status != StatusSolicitacao.AGUARDANDO_APROVACAO) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Não há proposta pendente."
            );
        }

        s.status = in.aprovado()
            ? StatusSolicitacao.APROVADO
            : StatusSolicitacao.RECUSADO;

        s.atualizadaEm = LocalDateTime.now();
        solicitacoes.save(s);

        if (in.aprovado()) {
            cobrancas.save(
                new Cobranca(
                    s,
                    orcamentos.findBySolicitacaoId(id)
                        .orElseThrow()
                        .total
                )
            );
        }

        notificar(
            s.oficina,
            "Resposta do cliente",
            c.nome
                + (in.aprovado() ? " aprovou" : " recusou")
                + " o orçamento da solicitação #" + id + "."
        );

        return dto(s);
    }

    @PutMapping("/solicitacoes/{id}/status")
    @Transactional
    Map<String, Object> atualizar(
        @PathVariable Long id,
        @Valid @RequestBody StatusIn in,
        Authentication a
    ) {
        Usuario o = atual(a);
        perfil(o, Perfil.OFICINA);

        Solicitacao s = solicitacao(id);

        if (
            s.oficina != null
            && !s.oficina.id.equals(o.id)
        ) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        boolean ok =
            (
                s.status == StatusSolicitacao.APROVADO
                && in.status() == StatusSolicitacao.EM_EXECUCAO
            )
            || (
                s.status == StatusSolicitacao.EM_EXECUCAO
                && in.status() == StatusSolicitacao.CONCLUIDO
            );

        if (!ok) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Transição de status não permitida."
            );
        }

        if (
            in.status() == StatusSolicitacao.CONCLUIDO
            && (
                in.laudo() == null
                || in.laudo().isBlank()
            )
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Laudo obrigatório para concluir."
            );
        }

        s.status = in.status();

        if (in.laudo() != null) {
            s.laudo = in.laudo().trim();
        }

        s.atualizadaEm = LocalDateTime.now();
        solicitacoes.save(s);

        notificar(
            s.cliente,
            "Serviço atualizado",
            "Sua solicitação #" + id + " está: " + s.status + "."
        );

        return dto(s);
    }

    @GetMapping("/notificacoes")
    List<Map<String, Object>> minhasNotificacoes(Authentication a) {
        return notificacoes
            .findByUsuarioIdOrderByCriadaEmDesc(atual(a).id)
            .stream()
            .map(n -> Map.<String, Object>of(
                "id", n.id,
                "titulo", n.titulo,
                "mensagem", n.mensagem,
                "lida", n.lida,
                "criadaEm", n.criadaEm
            ))
            .toList();
    }

    @PutMapping("/notificacoes/{id}/lida")
    void ler(
        @PathVariable Long id,
        Authentication a
    ) {
        Usuario u = atual(a);

        Notificacao n = notificacoes.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND)
            );

        if (!n.usuario.id.equals(u.id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        n.lida = true;
        notificacoes.save(n);
    }

    @PostMapping("/solicitacoes/{id}/avaliacao")
    @Transactional
    ResponseEntity<?> avaliar(
        @PathVariable Long id,
        @Valid @RequestBody AvaliacaoIn in,
        Authentication a
    ) {
        Usuario c = atual(a);
        perfil(c, Perfil.CLIENTE);

        Solicitacao s = solicitacao(id);

        if (!s.cliente.id.equals(c.id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (s.status != StatusSolicitacao.CONCLUIDO) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Avalie somente serviços concluídos."
            );
        }

        if (avaliacoes.findBySolicitacaoId(id).isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Serviço já avaliado."
            );
        }

        Avaliacao r = avaliacoes.save(
            new Avaliacao(s, in.nota(), in.comentario())
        );

        return ResponseEntity.status(201).body(
            Map.of("id", r.id, "nota", r.nota)
        );
    }

    @GetMapping("/cobrancas")
    List<Map<String, Object>> listarCobrancas(Authentication a) {
        Usuario u = atual(a);

        return cobrancas.findAll()
            .stream()
            .filter(c ->
                u.perfil == Perfil.ADMINISTRADOR
                || c.solicitacao.cliente.id.equals(u.id)
                || (
                    c.solicitacao.oficina != null
                    && c.solicitacao.oficina.id.equals(u.id)
                )
            )
            .map(this::cobrancaDto)
            .toList();
    }

    private Map<String, Object> cobrancaDto(Cobranca c) {
        return Map.of(
            "id", c.id,
            "solicitacaoId", c.solicitacao.id,
            "cliente", c.solicitacao.cliente.nome,
            "servico", c.solicitacao.servico,
            "valor", c.valor,
            "status", c.status,
            "descricao", c.descricao,
            "criadaEm", c.criadaEm
        );
    }

    @PutMapping("/cobrancas/{id}/status")
    @Transactional
    Map<String, Object> atualizarCobranca(
        @PathVariable Long id,
        @Valid @RequestBody CobrancaIn in,
        Authentication a
    ) {
        Usuario u = atual(a);
        perfil(u, Perfil.OFICINA);

        Cobranca c = cobrancas.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND)
            );

        if (
            c.solicitacao.oficina == null
            || !c.solicitacao.oficina.id.equals(u.id)
        ) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (
            !in.status().equals("PAGO")
            && !in.status().equals("PENDENTE")
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Status inválido"
            );
        }

        if (c.status.equals(in.status())) {
            return cobrancaDto(c);
        }

        c.status = in.status();
        cobrancas.save(c);

        notificar(
            c.solicitacao.cliente,
            "Cobrança atualizada",
            "Cobrança #" + c.id + ": " + c.status
        );

        return cobrancaDto(c);
    }

    @GetMapping("/pecas")
    List<Map<String, Object>> listarPecas(Authentication a) {
        Usuario u = atual(a);

        if (
            u.perfil != Perfil.FORNECEDOR
            && u.perfil != Perfil.OFICINA
            && u.perfil != Perfil.ADMINISTRADOR
        ) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        List<Peca> lista =
            u.perfil == Perfil.FORNECEDOR
                ? pecas.findByFornecedorId(u.id)
                : pecas.findAllByOrderByNomeAsc();

        return lista.stream()
            .map(p -> Map.<String, Object>of(
                "id", p.id,
                "codigo", p.codigo,
                "nome", p.nome,
                "preco", p.preco,
                "quantidade", p.quantidade,
                "fornecedor", p.fornecedor.nome
            ))
            .toList();
    }

    @PostMapping("/pecas")
    ResponseEntity<?> cadastrarPeca(
        @Valid @RequestBody PecaIn in,
        Authentication a
    ) {
        Usuario u = atual(a);
        perfil(u, Perfil.FORNECEDOR);

        if (
            pecas.findByFornecedorId(u.id)
                .stream()
                .anyMatch(x ->
                    x.codigo.equalsIgnoreCase(in.codigo().trim())
                )
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Código de peça já cadastrado."
            );
        }

        Peca p = pecas.save(
            new Peca(
                u,
                in.codigo().trim(),
                in.nome().trim(),
                in.preco(),
                in.quantidade()
            )
        );

        return ResponseEntity.status(201).body(
            Map.of(
                "id", p.id,
                "mensagem", "Peça cadastrada."
            )
        );
    }

    @PutMapping("/pecas/{id}")
    @Transactional
    Map<String, Object> editarPeca(
        @PathVariable Long id,
        @Valid @RequestBody PecaEstoqueIn in,
        Authentication a
    ) {
        Usuario u = atual(a);
        perfil(u, Perfil.FORNECEDOR);

        Peca p = pecas.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND)
            );

        if (!p.fornecedor.id.equals(u.id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        p.preco = in.preco();
        p.quantidade = in.quantidade();
        pecas.save(p);

        return Map.of(
            "id", p.id,
            "preco", p.preco,
            "quantidade", p.quantidade
        );
    }

    @GetMapping("/solicitacoes/{id}/historico-orcamento")
    List<Map<String, Object>> historico(
        @PathVariable Long id,
        Authentication a
    ) {
        Usuario u = atual(a);
        Solicitacao s = solicitacao(id);
        autorizar(s, u);

        return orcamentos.findBySolicitacaoId(id)
            .map(o ->
                historico.findByOrcamentoIdOrderByRegistradoEmDesc(o.id)
                    .stream()
                    .map(h -> Map.<String, Object>of(
                        "id", h.id,
                        "total", h.total,
                        "descricao", h.descricao,
                        "registradoEm", h.registradoEm
                    ))
                    .toList()
            )
            .orElse(List.of());
    }

    @GetMapping("/oficinas/{id}/avaliacoes")
    List<Map<String, Object>> avaliacoesOficina(
        @PathVariable Long id,
        Authentication a
    ) {
        atual(a);

        return avaliacoes.findByOficinaId(id)
            .stream()
            .map(v -> Map.<String, Object>of(
                "nota", v.nota,
                "comentario",
                v.comentario == null ? "" : v.comentario,
                "criadaEm", v.criadaEm
            ))
            .toList();
    }

    @GetMapping("/solicitacoes/{id}/mensagens")
    List<Map<String, Object>> mensagens(
        @PathVariable Long id,
        Authentication a
    ) {
        Usuario u = atual(a);
        Solicitacao s = solicitacao(id);
        autorizar(s, u);

        return mensagens.findBySolicitacaoIdOrderByEnviadaEmAsc(id)
            .stream()
            .map(m -> Map.<String, Object>of(
                "id", m.id,
                "remetente", m.remetente.nome,
                "remetenteId", m.remetente.id,
                "texto", m.texto,
                "enviadaEm", m.enviadaEm
            ))
            .toList();
    }

    @PostMapping("/solicitacoes/{id}/mensagens")
    @Transactional
    ResponseEntity<?> enviarMensagem(
        @PathVariable Long id,
        @Valid @RequestBody MensagemIn in,
        Authentication a
    ) {
        Usuario u = atual(a);
        Solicitacao s = solicitacao(id);
        autorizar(s, u);

        if (
            u.perfil != Perfil.CLIENTE
            && u.perfil != Perfil.OFICINA
        ) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        String texto = in.texto().trim();

        if (texto.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Mensagem vazia"
            );
        }

        MensagemAtendimento m = mensagens.save(
            new MensagemAtendimento(s, u, texto)
        );

        Usuario destino =
            u.id.equals(s.cliente.id)
                ? s.oficina
                : s.cliente;

        if (destino != null) {
            notificar(
                destino,
                "Nova mensagem no atendimento #" + s.id,
                u.nome + " enviou uma mensagem sobre " + s.servico
            );
        }

        return ResponseEntity.status(201).body(
            Map.of(
                "id", m.id,
                "enviadaEm", m.enviadaEm
            )
        );
    }

    @GetMapping("/solicitacoes/{id}/anexos")
    List<Map<String, Object>> listarAnexos(
        @PathVariable Long id,
        Authentication a
    ) {
        Solicitacao s = solicitacao(id);
        autorizar(s, atual(a));

        return anexos.findBySolicitacaoIdOrderByCriadoEmDesc(id)
            .stream()
            .map(x -> Map.<String, Object>of(
                "id", x.id,
                "nome", x.nome,
                "tipo", x.tipo,
                "autor", x.autor.nome,
                "criadoEm", x.criadoEm
            ))
            .toList();
    }

    @PostMapping("/solicitacoes/{id}/anexos")
    @Transactional
    ResponseEntity<?> adicionarAnexo(
        @PathVariable Long id,
        @Valid @RequestBody AnexoIn in,
        Authentication a
    ) {
        Usuario u = atual(a);
        Solicitacao s = solicitacao(id);
        autorizar(s, u);

        if (
            u.perfil != Perfil.CLIENTE
            && u.perfil != Perfil.OFICINA
        ) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (!Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm"
        ).contains(in.tipo())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Tipo de arquivo não permitido"
            );
        }

        if (in.base64().length() > 4200000) {
            throw new ResponseStatusException(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Arquivo acima de 3 MB"
            );
        }

        byte[] bytes;

        try {
            bytes = Base64.getDecoder().decode(in.base64());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Arquivo inválido"
            );
        }

        if (
            bytes.length == 0
            || bytes.length > 3 * 1024 * 1024
        ) {
            throw new ResponseStatusException(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Tamanho inválido (máximo 3 MB)"
            );
        }

        String nome = in.nome()
            .replaceAll("[^\\p{L}\\p{N}._ -]", "_");

        if (nome.length() > 150) {
            nome = nome.substring(0, 150);
        }

        AnexoAtendimento x = anexos.save(
            new AnexoAtendimento(
                s,
                u,
                nome,
                in.tipo(),
                bytes
            )
        );

        Usuario destino =
            u.id.equals(s.cliente.id)
                ? s.oficina
                : s.cliente;

        if (destino != null) {
            notificar(
                destino,
                "Novo anexo no atendimento #" + id,
                "Arquivo enviado por " + u.nome
            );
        }

        return ResponseEntity.status(201).body(
            Map.of(
                "id", x.id,
                "nome", x.nome
            )
        );
    }

    @GetMapping("/solicitacoes/{id}/anexos/{anexoId}")
    ResponseEntity<byte[]> baixarAnexo(
        @PathVariable Long id,
        @PathVariable Long anexoId,
        Authentication a
    ) {
        Solicitacao s = solicitacao(id);
        autorizar(s, atual(a));

        AnexoAtendimento x = anexos.findById(anexoId)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND)
            );

        if (!x.solicitacao.id.equals(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(x.tipo))
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"arquivo\""
            )
            .body(x.conteudo);
    }

    @GetMapping("/solicitacoes/{id}/diario")
    List<Map<String, Object>> listarDiario(
        @PathVariable Long id,
        Authentication a
    ) {
        Solicitacao s = solicitacao(id);
        autorizar(s, atual(a));

        return diario.findBySolicitacaoIdOrderByCriadoEmDesc(id)
            .stream()
            .map(x -> Map.<String, Object>of(
                "id", x.id,
                "oficina", x.oficina.nome,
                "observacao", x.observacao,
                "criadoEm", x.criadoEm
            ))
            .toList();
    }

    @PostMapping("/solicitacoes/{id}/diario")
    @Transactional
    ResponseEntity<?> adicionarDiario(
        @PathVariable Long id,
        @Valid @RequestBody DiarioIn in,
        Authentication a
    ) {
        Usuario u = atual(a);
        perfil(u, Perfil.OFICINA);

        Solicitacao s = solicitacao(id);

        if (
            s.oficina == null
            || !s.oficina.id.equals(u.id)
        ) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        if (
            s.status != StatusSolicitacao.APROVADO
            && s.status != StatusSolicitacao.EM_EXECUCAO
            && s.status != StatusSolicitacao.CONCLUIDO
        ) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Diário disponível após aprovação"
            );
        }

        DiarioManutencao x = diario.save(
            new DiarioManutencao(
                s,
                u,
                in.observacao().trim()
            )
        );

        notificar(
            s.cliente,
            "Atualização da manutenção #" + id,
            "A oficina registrou uma atualização no diário."
        );

        return ResponseEntity.status(201).body(
            Map.of("id", x.id)
        );
    }

    @GetMapping("/admin/usuarios")
    List<Map<String, Object>> usuariosAdmin(Authentication a) {
        perfil(atual(a), Perfil.ADMINISTRADOR);

        return usuarios.findAll()
            .stream()
            .map(u -> Map.<String, Object>of(
                "id", u.id,
                "nome", u.nome,
                "email", u.email,
                "perfil", u.perfil
            ))
            .toList();
    }

    @GetMapping("/oficina/indicadores")
    Map<String, Object> indicadores(Authentication a) {
        Usuario o = atual(a);
        perfil(o, Perfil.OFICINA);

        List<Solicitacao> lista =
            solicitacoes.findByOficinaIdOrderByCriadaEmDesc(o.id);

        long total = lista.size();

        long aprovados = lista.stream()
            .filter(s ->
                s.status == StatusSolicitacao.APROVADO
                || s.status == StatusSolicitacao.EM_EXECUCAO
                || s.status == StatusSolicitacao.CONCLUIDO
            )
            .count();

        long concluidos = lista.stream()
            .filter(s ->
                s.status == StatusSolicitacao.CONCLUIDO
            )
            .count();

        long pendentes = lista.stream()
            .filter(s ->
                s.status == StatusSolicitacao.AGUARDANDO_APROVACAO
            )
            .count();

        return Map.of(
            "totalSolicitacoes", total,
            "aprovados", aprovados,
            "concluidos", concluidos,
            "pendentes", pendentes
        );
    }

    private Map<String, Object> dto(Solicitacao s) {
        Map<String, Object> m = new LinkedHashMap<>();

        m.put("id", s.id);
        m.put("cliente", s.cliente.nome);
        m.put("clienteId", s.cliente.id);
        m.put("oficina", s.oficina == null ? "" : s.oficina.nome);
        m.put("oficinaId", s.oficina == null ? 0 : s.oficina.id);
        m.put("veiculoId", s.veiculo.id);
        m.put("veiculo", s.veiculo.modelo);
        m.put("placa", s.veiculo.placa);
        m.put("servico", s.servico);
        m.put("descricao", s.descricao);
        m.put("status", s.status);
        m.put("laudo", s.laudo);
        m.put("criadaEm", s.criadaEm);
        m.put("atualizadaEm", s.atualizadaEm);

        m.put(
            "avaliado",
            avaliacoes.findBySolicitacaoId(s.id).isPresent()
        );

        orcamentos.findBySolicitacaoId(s.id).ifPresent(q ->
            m.put(
                "orcamento",
                Map.of(
                    "pecas", q.pecas,
                    "maoDeObra", q.maoDeObra,
                    "desconto", q.desconto,
                    "adicionais", q.adicionais,
                    "total", q.total,
                    "prazoDias", q.prazoDias,
                    "observacoes",
                    q.observacoes == null ? "" : q.observacoes
                )
            )
        );

        return m;
    }
}

