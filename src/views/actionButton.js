//A round, tinted button with a caption underneath. Shows either a bootstrap icon or short text (e.g. an hour like "10").
//color is one of the theme colors in index.css (success, warning, info, error)
export function ActionButton(props) {
  const diameter = props.small ? 48 : 60;

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: diameter + 10}}>
      <button type='button' className='roundButton' onClick={props.onClick} disabled={!props.enabled}
        style={{width: diameter, height: diameter, '--accent': `var(--${props.color})`}}>
        {props.icon ?
          <i style={{fontSize: props.small ? 20 : 24}} className={`bi bi-${props.icon}`}/> :
          <span style={{fontSize: 18, fontWeight: 700}}>{props.innerText}</span>
        }
      </button>
      <span className='caption'>{props.text}</span>
    </div>
  );
}
