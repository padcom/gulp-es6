import Person from './person';

let person = new Person();
console.log(person);

$.get('/api/data').then(data => { $(document.body).append(data.message); });

var items = (
  <ul>
    <li>a</li>
    <li>b</li>
    <li>c</li>
  </ul>
);

ReactDOM.render(items, document.getElementById('react-output'));
