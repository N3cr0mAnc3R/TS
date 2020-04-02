using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace WebApp.Models.DB
{
    public static class Extender
    {
        public static IEnumerable<T> Distinct<T, TKey>(this IEnumerable<T> source, Func<T, TKey> selector)
        {
            return source.Distinct(new GenericComparer<T, TKey>(selector));
        }
        private class GenericComparer<T, TOutput> : IEqualityComparer<T>
        {
            private Func<T, TOutput> selector;

            public GenericComparer(Func<T, TOutput> checkFunc)
            {
                this.selector = checkFunc;
            }

            public bool Equals(T x, T y)
            {
                return selector(x).Equals(selector(y));
            }

            public int GetHashCode(T obj)
            {
                return selector(obj).GetHashCode();
            }
        }
        public static IDbDataParameter AddWithValue(this IDbCommand command, string parameterName, object value = null, SqlDbType? type = null, ParameterDirection direction = ParameterDirection.Input)
        {
            var p = command.CreateParameter();
            p.ParameterName = parameterName;
            p.Value = value;
            if (type.HasValue) ((SqlParameter)p).SqlDbType = type.Value;
            p.Direction = direction;
            command.Parameters.Add(p);
            return p;
        }
        public static IEnumerable<T> ForEach<T>(this IEnumerable<T> source, Action<T> action)
        {
            foreach (var element in source)
            {
                action(element);
            }

            return source;
        }
    }
}