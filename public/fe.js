$.getJSON('/api/exercise/users', function(obj){
  var ul = $('<ul>');
  $.each(obj.data, function(k,v){
    ul.append($('<li>').text(v.username + ': ' + v._id));
  });
  $('#allUser').append(ul);
});