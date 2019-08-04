$.getJSON('/api/exercise/users', function(obj){
  var ul = $('<ul>');
  $.each(obj, function(k,v){
    ul.append($('<li>').text(v.username + ': ' + v._id));
  });
  $('#allUser').append(ul);
});