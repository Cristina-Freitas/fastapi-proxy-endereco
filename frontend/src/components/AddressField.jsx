export default function AddressField({ Icone, rotulo, valor }) {
  return (
    <div className="campo-endereco">
      <span className="campo-endereco__icone" aria-hidden="true">
        <Icone size={20} />
      </span>
      <div>
        <dt>{rotulo}</dt>
        <dd className={valor ? undefined : 'campo-endereco__vazio'}>
          {valor || '—'}
        </dd>
      </div>
    </div>
  )
}
