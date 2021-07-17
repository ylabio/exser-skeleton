const {query, schema} = require('exser').utils;

/**
 *
 * @param admin {AdminService}
 * @param services
 */
module.exports = async (admin, services) => {

  admin.side('menu', {
    control: 'MenuVertical',
    props: {
      items: {
        _longevity: {
          title: 'Longevity',
          kind: 'group',
          icon: 'DatabaseOutlined',
          items: {
            _ages: {title: 'Роли', show: 'page=roles'},
            _odds: {title: 'Узлы', icon: 'HeartOutlined', show: 'page=nodes'},
            _link: {title: 'Ссылка', url: '/private/roles'},
            _site: {title: 'Сайт', url: 'http://react-skeleton.ru'}
          }
        },
        _system: {
          title: 'System', items: []
        }
      }
    },
  });
};