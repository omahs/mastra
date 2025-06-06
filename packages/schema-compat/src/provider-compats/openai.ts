import type { LanguageModelV1 } from 'ai';
import type { z } from 'zod';
import type { Targets } from 'zod-to-json-schema';
import { SchemaCompatLayer } from '../schema-compatibility';
import type { ShapeValue, StringCheckType } from '../schema-compatibility';

export class OpenAISchemaCompatLayer extends SchemaCompatLayer {
  constructor(model: LanguageModelV1) {
    super(model);
  }

  getSchemaTarget(): Targets | undefined {
    return `jsonSchema7`;
  }

  shouldApply(): boolean {
    if (
      !this.getModel().supportsStructuredOutputs &&
      (this.getModel().provider.includes(`openai`) || this.getModel().modelId.includes(`openai`))
    ) {
      return true;
    }

    return false;
  }

  processZodType<T extends z.AnyZodObject>(value: z.ZodTypeAny): ShapeValue<T> {
    switch (value._def.typeName) {
      case 'ZodOptional':
        return this.defaultZodOptionalHandler(value, [
          'ZodObject',
          'ZodArray',
          'ZodUnion',
          'ZodString',
          'ZodNever',
          'ZodUndefined',
          'ZodTuple',
        ]);
      case 'ZodObject': {
        return this.defaultZodObjectHandler(value);
      }
      case 'ZodUnion': {
        return this.defaultZodUnionHandler(value);
      }
      case 'ZodArray': {
        return this.defaultZodArrayHandler(value);
      }
      case 'ZodString': {
        const model = this.getModel();
        const checks: StringCheckType[] = ['emoji'];

        if (model.modelId.includes('gpt-4o-mini')) {
          checks.push('regex');
        }
        return this.defaultZodStringHandler(value, checks);
      }
      default:
        return this.defaultUnsupportedZodTypeHandler(value, ['ZodNever', 'ZodUndefined', 'ZodTuple']);
    }
  }
}
