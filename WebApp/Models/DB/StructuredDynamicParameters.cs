using Dapper;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Routing;

namespace WebApp.Models.DB
{
    public class StructuredDynamicParameters : SqlMapper.IDynamicParameters
    {
        private IDictionary<string, object> param;

        public StructuredDynamicParameters(object param)
        {
            if (param == null) throw new ArgumentNullException("param");
            this.param = new RouteValueDictionary(param);
        }


        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            var simple = new Dictionary<string, object>();

            foreach (var item in param)
            {
                Type type;
                if (item.Value == null || (type = GetListType(item.Value.GetType())) == null) // если это не коллекция добавить в список простых параметров, а заодно и получить тип коллекции
                {
                    simple.Add(item.Key, item.Value);
                    continue;
                }

                // добавить структурированный параметр
                AddParameter(command, item.Key, item.Value, type);
            }


            // добавить простые параметры
            if (simple.Count > 0)
            {
                SqlMapper.IDynamicParameters d = new DynamicParameters(simple);
                d.AddParameters(command, identity);
            }
        }


        private void AddParameter(IDbCommand command, string name, object value, Type listType)
        {
            // получить тип элемента коллекции
            var itemType = listType.GetGenericArguments()[0];

            // создать таблицу с колонками
            DataTable table = new DataTable();
            foreach (var propInfo in itemType.GetProperties().Distinct(i => i.Name))
            {
                var type = propInfo.PropertyType;
                table.Columns.Add(propInfo.Name, type.IsEnum ? propInfo.PropertyType.GetEnumUnderlyingType() : (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Nullable<>)) ? Nullable.GetUnderlyingType(type) : propInfo.PropertyType);
            }

            // добавить записи
            foreach (var item in (IEnumerable)value)
            {
                var values = new RouteValueDictionary(item).Values.ToArray();
                table.Rows.Add(values);
            }

            command.AddWithValue(name, table, SqlDbType.Structured);
        }

        private Type GetListType(Type type)
        {
            return type.GetInterfaces().FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IList<>));
        }

        private Type GetDbCompatibleType(Type type)
        {
            if (type.IsEnum) return type.GetEnumUnderlyingType();
            else if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Nullable<>)) return Nullable.GetUnderlyingType(type);
            else return type;
        }
    }
}