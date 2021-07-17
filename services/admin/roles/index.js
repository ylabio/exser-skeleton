const {query, schema} = require('exser').utils;

/**
 *
 * @param admin {AdminService}
 * @param services
 */
module.exports = async (admin, services) => {

  admin.page('roles', {
    //place: 'page',  // page, side, head, footer, panel, modal
    control: 'UniversalList',// universal-form, select-dropdown, ...
    props: {
      title: 'Роли',
      description: '',

      // АПИ выборки с фильтром
      api: '',
      // Фильтры, сортировки, пагинации
      filters: {},
      // Колонки, связка со свойством, контрол вывода. По колонкам можно построить fields
      cols: {
        //role: {field: 'role._id', title: 'Role', show: 'inline=select', props: {}}
      },
      // Действия: главные, с выделенными строками, для строки
      actions: {},
    },
    // show: ['side=menu'],
    // hide: ['footer'],



    // route: '/roles',
    // api: '/api/v1/roles',
    // params: {
    //   fields: 'items(*),count'
    // },
    // columns: {
    //   'id': {title: 'ID', field: 'id'},
    //   'value': {title: 'Age', field: 'value'}
    // },
    // example: {
    //   id: 0,
    //   value: 0
    // },
    // actions: [
    //   {title: 'Создать', $show: 'ages/create'},
    // ],
    // actionsItem: [//@todo
    //   {title: 'Редактировать', $show: {name: 'ages/:id', props: {id: '$item.id'}}},
    //   {title: 'Удалить', $show: {name: 'ages/:id/delete', props: {id: '$item.id'}}}
    // ],

  });

  admin.page('roles/:id', {
    control: 'UniversalList',// universal-form, select-dropdown, ...
    props: {
      title: 'Роль!',
      description: '',
    },
    // show: ['side=menu'],
    // hide: ['footer'],



    // route: '/ages/:id',
    // api: '/api/v1/ages',
    // params: {
    //   fields: 'items(*),count'
    // },
    // columns: {
    //   'id': {title: 'ID', field: 'id'},
    //   'value': {title: 'Age', field: 'value'}
    // },
    // example: {
    //   id: 0,
    //   value: 0
    // },
    // actionsMain: [
    //   {name: 'users'},
    // ],
    // actionsItem: [//@todo
    // ]
  });
}