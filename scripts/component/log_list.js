var LogList = React.createClass({
  render: function() {
    var colsHead = [];
    var heading = ['Level', 'Time', 'Thread', 'Module', 'File', 'Line', 'Message'];
    for (var i in heading) {
      colsHead.push(React.DOM.th({ key: i }, heading[i]));
    }
    var head = React.DOM.thead(null, colsHead);
    var rows = [];
    var temp;
    var matchFound;
    var keys = ['level', 'time', 'thread', 'module', 'file', 'line', 'msg'];
    for (var i in this.props.list) {
      i = parseInt(i);
      temp = [];
      matchFound = !this.props.filter;
      if (!matchFound) {
        this.props.filter = this.props.filter.toLowerCase();
      }
      for (var j in keys) {
        j = parseInt(j);
        if (this.props.filter && !matchFound && keys[j] === 'msg') {
          matchFound = this.props.list[i][keys[j]].toLowerCase().indexOf(this.props.filter) > -1;
        }
        if (keys[j] === 'time') {
          this.props.list[i][keys[j]] = new Date(this.props.list[i][keys[j]]).toLocaleString();
        }
        temp.push(React.DOM.td({key: j}, this.props.list[i][keys[j]]));
      }
      if (matchFound) {
        rows.push(React.DOM.tr({key: i}, temp));
      }
    }
    var body = React.DOM.tbody(null, rows);
    var table = React.DOM.table( {key:'body', className:''}, [head, body] );
    if (!this.props.isEndOfList) {
      return React.DOM.div({key:''}, [ table, React.DOM.p({key: ''}, 'Loading..')]);
    }
    return table;
  }
});

window.logVisualiser.value('LogList', LogList);
